---
title: "〖iOS〗weak底层实现"
description: "从 objc_initWeak、storeWeak、SideTable 到 weak_table_t，系统梳理 Objective-C 中 weak 的底层实现。"
date: "2026-06-05"
readingTime: "10 min read"
tags:
  - iOS
  - Objective-C
  - Runtime
  - weak
---

# 〖iOS〗weak底层实现

## 简介

我们先定义一段最简单的使用示例：

```obj
__weak id weakObj = obj;
```

首先我们先看到一个 `objc_initWeak` 的底层实现如下：

![objc_initWeak](/images/posts/weak-initweak.png)

这段代码本质上是在给一个 `__weak` 指针做初始化绑定，将弱引用位置登记到 runtime 的 weak 表中。(初始化一个 weak 变量，让它弱引用 `newObj`，并把这个 weak 变量的位置登记到 runtime 的弱引用表中。)

其中的 `location` 表示变量本身的地址，即 `location = &weakObj`，是保存 weak 指针的那个内存位置。

`newObj` 表示 weak 变量要指向的新对象，即 `newObj = obj`。

下面我们看一下真正的 `storeWeak` 实现：`storeWeak` 是 Runtime 内部统一处理 weak 引用存储的函数。

它不仅用于初始化 weak，也用于 weak 赋值、销毁、更新等场景。

## storeWeak

```objc
//整体作用就是将weak指针location从旧对象关系中移除再注册带到新对象的weak表中
static id 
storeWeak(id *location, objc_object *newObj)
{
    ASSERT(haveOld  ||  haveNew);//至少要处理旧对象或者新对象之一
    if (!haveNew) ASSERT(newObj == nil);

    Class previouslyInitializedClass = nil;//避免反复初始化同一个类，导致无限retry
    id oldObj;//weak指针原来指向的旧对象
    SideTable *oldTable;
    SideTable *newTable;

    // Acquire locks for old and new values.
    // Order by lock address to prevent lock ordering problems. 
    // Retry if the old value changes underneath us.
 retry://storeWeak 可能因为并发问题重新来一遍，因为weak指针所在的location可能被其它线程同时修改
    if (haveOld) {//读取旧对象和旧的sidetable
        oldObj = *location;
        oldTable = &SideTables()[oldObj];//读取旧对象的散列表，后面要从旧对象的weak表中移除location
    } else {
        oldTable = nil;
    }
    if (haveNew) {//读取新对象的散列表
        newTable = &SideTables()[newObj];
    } else {
        newTable = nil;
    }

    SideTable::lockTwo<haveOld, haveNew>(oldTable, newTable);//weak表是全局共享结构，需要加锁保护，注意多线程同时加两把锁，必须按照固定顺序加锁，避免死锁

    if (haveOld  &&  *location != oldObj) {//检查oldObj有没有被别的线程修改掉
        SideTable::unlockTwo<haveOld, haveNew>(oldTable, newTable);
        goto retry;
    }

    // Prevent a deadlock between the weak reference machinery
    // and the +initialize machinery by ensuring that no 
    // weakly-referenced object has an un-+initialized isa.
    if (haveNew  &&  newObj) {
        Class cls = newObj->getIsa();
      //检查这个类是否已经执行过initialize方法，这里需要保证类已经初始化完成
        if (cls != previouslyInitializedClass  &&  
            !((objc_class *)cls)->isInitialized()) 
        {
            SideTable::unlockTwo<haveOld, haveNew>(oldTable, newTable);//解锁避免死锁，+initialize 可能执行任意 Objective-C 代码
            class_initialize(cls, (id)newObj);

            // If this class is finished with +initialize then we're good.
            // If this class is still running +initialize on this thread 
            // (i.e. +initialize called storeWeak on an instance of itself)
            // then we may proceed but it will appear initializing and 
            // not yet initialized to the check above.
            // Instead set previouslyInitializedClass to recognize it on retry.
            previouslyInitializedClass = cls;//previouslyInitializedClass 用来防止 +initialize 递归场景下无限重试

            goto retry;//执行 class_initialize 的过程中，location 或 weak 表状态都可能变化。
        }
    }

    // Clean up old value, if any.
    if (haveOld) {//如果有旧对象，就从旧对象的weak表中移除当前weak指针
        weak_unregister_no_lock(&oldTable->weak_table, oldObj, location);
    }

    // Assign new value, if any.
    if (haveNew) {//注册新的weak引用
        newObj = (objc_object *)
            weak_register_no_lock(&newTable->weak_table, (id)newObj, location, 
                                  crashIfDeallocating ? CrashIfDeallocating : ReturnNilIfDeallocating);
        // weak_register_no_lock returns nil if weak store should be rejected

        // Set is-weakly-referenced bit in refcount table.
        if (!_objc_isTaggedPointerOrNil(newObj)) {//标记对象被weak引用过，后面对象释放时就可以直接判断了，免得再查
            newObj->setWeaklyReferenced_nolock();
        }

        // Do not set *location anywhere else. That would introduce a race.
        *location = (id)newObj;//真正修改weak指向的修
    }
    else {
        // No new value. The storage is not changed.
    }
    
    SideTable::unlockTwo<haveOld, haveNew>(oldTable, newTable);

    // This must be called without the locks held, as it can invoke
    // arbitrary code. In particular, even if _setWeaklyReferenced
    // is not implemented, resolveInstanceMethod: may be, and may
    // call back into the weak reference machinery.
    callSetWeaklyReferenced((id)newObj);

    return (id)newObj;
}
```

我们使用自然语言总结一下上面的过程如下：

- 方法实际接受了三个参数：`haveOld`、`haveNew`、`crashIfDeallocating`。
- 同时方法维护了 `oldTable` 和 `newTable`。
- 如果之前指向了一个弱引用指针，那么现在就会调用 `weak_register_no_lock` 解除引用。
- 如果 weak 指针现在要指向一个新的引用，就会调用 `weak_register_no_lock` 将新的 weak 指针地址添加到弱引用表中。
- 最后调用 `setWeaklyReferenced_nolock` 修改 weak 新引用对象的 bit 标志位。

## SideTable

运行时会根据对象的地址，在全局的 `SideTables` 中找到对应的表，是很多对象共享的。

```objc
struct SideTable {
    spinlock_t slock;//自旋锁：os_unfair_lock
    RefcountMap refcnts;//引用计数表，存储额外的引用信息：以对象的地址为key
    weak_table_t weak_table;//弱易用表，用于管理__weak指针：保存多个对象的weak_entry_t

    SideTable() {
        memset(&weak_table, 0, sizeof(weak_table));
    }

    ~SideTable() {
        _objc_fatal("Do not delete SideTable.");//SideTable 是运行时全局管理的数据结构，生命周期基本上和进程一致。它通常存在于全局的 SideTables 中，用来长期管理对象的引用计数和弱引用信息。所以如果误删直接崩溃
    }

    void lock() { slock.lock(); }
    void unlock() { slock.unlock(); }
    void reset() { slock.reset(); }

    // Address-ordered lock discipline for a pair of side tables.

    template<HaveOld, HaveNew>//根据是否存在oldObj/newObj生成不同的加锁逻辑
    static void lockTwo(SideTable *lock1, SideTable *lock2);
    template<HaveOld, HaveNew>
    static void unlockTwo(SideTable *lock1, SideTable *lock2);
};
```

iOS 项目中会维护一个全局的 `sidetables`，其中包含了多个 `SideTable`（真机 8 个、模拟器 64 个），不会将每一个对象都创建一个 `SideTable`，而是多个对象共用同一张 `SideTable`。我们看一下下面的函数：

```objc
    PaddedT array[StripeCount];
    //核心算法,均匀分配到真机8张表中。
    static unsigned int indexForPointer(const void *p) {
        uintptr_t addr = reinterpret_cast<uintptr_t>(p);
        return ((addr >> 4) ^ (addr >> 9)) % StripeCount;
    }
```

- `indexForPointer` 通过对象的地址确定是在 `array` 中的第几个元素，从而拿到哈希值。
- 为什么不直接使用 `SideTable array[StripeCount]`？主要原因是为了减少伪共享 false sharing，因为多个 `SideTable` 是给多线程并发使用的，如果直接使用 `sideTable 0`、`sideTable 1` 这种形式，它们在内存空间中可能挨得很近，甚至可能落在同一 CPU 的缓存行中，导致 CPU 缓存频繁失效。
- 多个对象可以映射到同一张 `SideTable`，但 `SideTable` 内部的 `refcnts` 和 `weak_table` 都会继续用对象地址作为 key。额外引用计数存在 `refcnts[obj]` 中，weak 关系存在 `weak_entry_t { referent = obj, referrers = weak指针地址列表 }` 中。

![weak结构图](/images/posts/weak-structure.png)

## weak_table_t

我们看一下弱引用表的结构：

```objc
struct weak_table_t {
    weak_entry_t *weak_entries;//哈希数组，存储对应的弱引用对象的信息
    size_t    num_entries;//数组元素个数
    uintptr_t mask;//hash数组长度-1
    uintptr_t max_hash_displacement;//存储可能发生哈希冲突的最大次数，判断是否出现逻辑错误
};
```

`weak_table_t` 是典型的 hash 结构。其中的 `weak_entries` 是一个动态数组，用来存储 `weak_entry_t` 类型的元素，这些元素实际上就是 OC 对象的弱引用信息。

## weak_entry_t

```objc
struct weak_entry_t {
    DisguisedPtr<objc_object> referent;//被弱引用的对象的伪装地址
    union {//weak_entry_t 有两种存储模式
        struct {//out-of-line 模式,weak 指针太多时，放到外部 referrers 哈希表里
            weak_referrer_t *referrers;//外部数组，保存一组weak变量地址
            uintptr_t        out_of_line_ness : 2;//标记当前是否切换到out-of-line模式
            uintptr_t        num_refs : PTR_MINUS_2;//表示 out-of-line 模式下，当前保存了多少个 weak referrer
            uintptr_t        mask;//用于out-of-line哈希表寻址
            uintptr_t        max_hash_displacement;//记录当前哈希表中最大偏移距，如果查找某个 referrer 时，探测距离已经超过 max_hash_displacement，就可以认为它不存在
        };
        struct {//inline 模式,少量 weak 指针直接存在 inline_referrers 数组里
            // out_of_line_ness field is low bits of inline_referrers[1]
            weak_referrer_t  inline_referrers[WEAK_INLINE_COUNT];
        };
    };

    bool out_of_line() {
        return (out_of_line_ness == REFERRERS_OUT_OF_LINE);
    }

  //赋值运算符号重载，由于内部的联合体存在，为了避免默认逐个字段处理，选择按字节直接拷贝
    weak_entry_t& operator=(const weak_entry_t& other) {
        memcpy(this, &other, sizeof(other));
        return *this;
    }

  //构造函数
    weak_entry_t(objc_object *newReferent, objc_object **newReferrer)
        : referent(newReferent)
    {
        inline_referrers[0] = newReferrer;
        for (int i = 1; i < WEAK_INLINE_COUNT; i++) {
            inline_referrers[i] = nil;
        }
    }
};
```

可以看到在 `weak_entry_t` 的结构体中有一个联合体成员，这个联合体中有一个定长数组 `inline_referrers[WEAK_INLINE_COUNT]` 和一个动态数组 `weak_referrer_t *referrers` 两种方式存储弱引用对象的指针地址，整体是通过一个 `out_of_line()` 函数来判断采用哪种存储方式，当弱引用对象的指针数目小于 `WEAK_INLINE_COUNT`，使用定长数组，超过 `WEAK_INLINE_COUNT` 时，将定长数组中的元素转移到动态数组中。

> 通过上面的介绍我们可以知道弱引用表的结构就是 hash 结构的表，以对象的伪地址作为 key，以 weak 变量的地址数组为 value。

## weak_register_no_lock

通过这个函数将一个 `__weak` 变量的地址登记到某个对象的弱引用表中，当对象销毁时，runtime 能够将这些 weak 变量自动置为 nil。

```objc
//referent_id:被弱引用的对象，obj
//referrer_id:weak变量本身的地址，&weakObj
id 
weak_register_no_lock(weak_table_t *weak_table, id referent_id, 
                      id *referrer_id, WeakRegisterDeallocatingOptions deallocatingOptions)
{
    objc_object *referent = (objc_object *)referent_id;
    objc_object **referrer = (objc_object **)referrer_id;

  //如果referent为nil或者是小对象类型，直接返回，不做操作
    if (_objc_isTaggedPointerOrNil(referent)) return referent_id;

    // ensure that the referenced object is viable
  //检查对象是否在释放
    if (deallocatingOptions == ReturnNilIfDeallocating ||
        deallocatingOptions == CrashIfDeallocating) {
        bool deallocating;
        if (!referent->ISA()->hasCustomRR()) {//判断有没有自定义的引用计数方法，没有则走runtime默认方式
            deallocating = referent->rootIsDeallocating();//如果返回true，说明对象已经处于释放流程中，不能继续安全建立引用
        } else {
            // Use lookUpImpOrForward so we can avoid the assert in
            // class_getInstanceMethod, since we intentionally make this
            // callout with the lock held.
          //如果当前类自定义了引用计数方法，runtime就会查找这个对象是否实现了allowsWeakReference方法
            auto allowsWeakReference = (BOOL(*)(objc_object *, SEL)) lookUpImpOrForwardTryCache((id)referent, @selector(allowsWeakReference), referent->getIsa());
            if ((IMP)allowsWeakReference == _objc_msgForward) {
                return nil;
            }
            deallocating =
            ! (*allowsWeakReference)(referent, @selector(allowsWeakReference));//调用 allowsWeakReference 判断能否 weak
        }

        if (deallocating) {
            if (deallocatingOptions == CrashIfDeallocating) {
                _objc_fatal("Cannot form weak reference to instance (%p) of "
                            "class %s. It is possible that this object was "
                            "over-released, or is in the process of deallocation.",
                            (void*)referent, object_getClassName((id)referent));
            } else {
                return nil;
            }
        }
    }

    // now remember it and where it is being stored
	//正式登记weak引用
  weak_entry_t *entry;
    if ((entry = weak_entry_for_referent(weak_table, referent))) {//先查找之前是否有referent对象的相关表
        append_referrer(entry, referrer);//如果有的话就新增一个元素
    } 
    else {//如果没有的话，先建表
        weak_entry_t new_entry(referent, referrer);
        weak_grow_maybe(weak_table);//如果weak表容量不够就扩容，尽量避免哈希冲突
        weak_entry_insert(weak_table, &new_entry);
    }

    // Do not set *referrer. objc_storeWeak() requires that the 
    // value not change.

    return referent_id;
}
```

## weak_entry_for_referent

一句话概述函数的作用就是，根据对象 `referent`，在全局弱引用表 `weak_table_t` 中找到对应的 `weak_entry_t`。

```objc
static weak_entry_t *
weak_entry_for_referent(weak_table_t *weak_table, objc_object *referent)
{
    ASSERT(referent);

    weak_entry_t *weak_entries = weak_table->weak_entries;

    if (!weak_entries) return nil;

    size_t begin = hash_pointer(referent) & weak_table->mask; // 根据对象地址计算它在哈希表里的起始下标，通过& weak_table->mask的位操作,来保证index不会越界
    size_t index = begin;//从begin开始查
    size_t hash_displacement = 0;//计算从原始哈希位置向后探测的步数
    while (weak_table->weak_entries[index].referent != referent) {//当前下标的 entry 不是我要找的对象，就继续往后找
        index = (index+1) & weak_table->mask;//处理环形数组
        if (index == begin) bad_weak_table(weak_table->weak_entries);//如果绕回起点，说明哈希表已经被异常填满，或者弱引用表结构被破坏了
        hash_displacement++;
        if (hash_displacement > weak_table->max_hash_displacement) {//weak_table->max_hash_displacement 记录了当前弱引用哈希表中，所有 entry 曾经发生过的最大偏移距离，如果超过最大距离还没找到就返回nil
            return nil;
        }
    }
    
    return &weak_table->weak_entries[index];
}
```

## append_referrer

该函数的作用是将一个新的 weak 指针地址 `new_referrer` 添加到某个对象对应的 `weak_entry_t` 中。

```objc
static void append_referrer(weak_entry_t *entry, objc_object **new_referrer)
{
    if (! entry->out_of_line()) {//如果是inline存储模式，放到定长数组中
        // Try to insert inline.
        for (size_t i = 0; i < WEAK_INLINE_COUNT; i++) {
            if (entry->inline_referrers[i] == nil) {
                entry->inline_referrers[i] = new_referrer;
                return;
            }
        }

        // Couldn't insert inline. Allocate out of line.
      //如果遍历结束都没有找到位置，说明inline放不下，需要转换成out_of_line模式
        weak_referrer_t *new_referrers = (weak_referrer_t *)
            calloc(WEAK_INLINE_COUNT, sizeof(weak_referrer_t));
        // This constructed table is invalid, but grow_refs_and_insert
        // will fix it and rehash it.
     // 这里临时构造出来的 new_referrers 表并不是一个合法的哈希表，但是后面的 grow_refs_and_insert 会重新扩容并重新哈希
        for (size_t i = 0; i < WEAK_INLINE_COUNT; i++) {
            new_referrers[i] = entry->inline_referrers[i];//将原来定长数组中的元素拷贝过来
        }
        entry->referrers = new_referrers;
        entry->num_refs = WEAK_INLINE_COUNT;
        entry->out_of_line_ness = REFERRERS_OUT_OF_LINE;
        entry->mask = WEAK_INLINE_COUNT-1;
        entry->max_hash_displacement = 0;
    }

    ASSERT(entry->out_of_line());

    if (entry->num_refs >= TABLE_SIZE(entry) * 3/4) {//判断哈希表是否需要扩容，哈希表使用开放寻址和线性探测，如果表太满，冲突会变多，查找和插入效率都会下降
        return grow_refs_and_insert(entry, new_referrer);//重新扩容，内部创建合法哈希表
    }
    size_t begin = w_hash_pointer(new_referrer) & (entry->mask);
    size_t index = begin;
    size_t hash_displacement = 0;
  //哈希表使用开放寻址和线性探测，如果表太满，冲突会变多，查找和插入效率都会下降
    while (entry->referrers[index] != nil) {
        hash_displacement++;
        index = (index+1) & entry->mask;
        if (index == begin) bad_weak_table(entry); //绕回起点说明哈希表结构损坏
    }
    if (hash_displacement > entry->max_hash_displacement) {//如果这次插入时探测距离比之前记录的最大距离还大，就更新最大探测距离
        entry->max_hash_displacement = hash_displacement;
    }
    weak_referrer_t &ref = entry->referrers[index];//先获取目标位置的引用
    ref = new_referrer;//赋值
    entry->num_refs++;//数量加一
}
```

这个函数负责把新的 weak 指针地址加入到某个对象对应的 weak_entry 中；少量时直接存在 inline 数组里，数量多了就转成 out-of-line 哈希表，并通过线性探测解决冲突。

## weak_clear_no_lock

```objc
void 
weak_clear_no_lock(weak_table_t *weak_table, id referent_id) 
{
    objc_object *referent = (objc_object *)referent_id;

    weak_entry_t *entry = weak_entry_for_referent(weak_table, referent);
    if (entry == nil) {
        /// XXX shouldn't happen, but does with mismatched CF/objc
        //printf("XXX no entry for clear deallocating %p\n", referent);
        return;
    }

    // zero out references
    weak_referrer_t *referrers;//找到保存weak指针的地址数组
    size_t count;//表示接下来要遍历的位置数
    
    if (entry->out_of_line()) {
        referrers = entry->referrers;
        count = TABLE_SIZE(entry);
    } 
    else {
        referrers = entry->inline_referrers;
        count = WEAK_INLINE_COUNT;
    }
    
    for (size_t i = 0; i < count; ++i) {
        objc_object **referrer = referrers[i];//取出一个 weak 变量地址
        if (referrer) {
            if (*referrer == referent) {//如果 weak 变量仍然指向当前对象，就置 nil
                *referrer = nil;
            }
            else if (*referrer) {//weak指针还在原对象的weak_referrent_t数组中，但是指向的不是当前对象，就报错
                REPORT_WEAK_ERROR("__weak variable at %p holds %p instead of %p. "
                                  "This is probably incorrect use of "
                                  "objc_storeWeak() and objc_loadWeak().",
                                  referrer, (void*)*referrer, (void*)referent);
            }
        }
    }
    
    weak_entry_remove(weak_table, entry);//所有关系都断开之后，移除weak_entry_t
}
```

## weak实现原理

Runtime 维护了一张 **weak_table_t 弱引用表**，用于记录某个对象被哪些 weak 变量引用。这张表本质上是哈希表，**key 可以理解为被引用对象的地址 referent**，value 是一个 `weak_entry_t`。`weak_entry_t` 中保存了所有指向该对象的 weak 变量地址，也就是 `objc_object **referrer` 数组。注意：这里保存的不是 weak 对象本身，而是 **weak 指针变量的地址**。

实现原理：

- 初始化 weak 指针，通过调用 `objc_initWeak(&weakObj, obj);` 方法，其中 `&weakObj` 是 weak 变量本身的地址，`obj` 是被弱引用的对象
- 注册或者更新 weak 引用：如果这个 weak 变量之前指向过其他对象，就要从旧对象对应的 `weak_entry_t` 中移除这个 weak 变量地址。如果新对象允许 weak 引用，就把这个 weak 变量地址注册到新对象对应的 `weak_entry_t` 中。
- 对象释放时清空 weak 指针：对象执行 `dealloc` 时，Runtime 会调用类似 `clearDeallocating` / `weak_clear_no_lock` 的逻辑。它会根据当前对象地址，在 weak 表中找到对应的 `weak_entry_t`，拿到所有 weak 变量地址，然后遍历这些地址，将所有指向该对象的 weak 变量自动置为 nil，并移除 `weak_entry_t`。

![weak原理图](https://i-blog.csdnimg.cn/img_convert/499eed29f4c6c64d7f78c297f5a9c307.webp?x-oss-process=image/format,png)
