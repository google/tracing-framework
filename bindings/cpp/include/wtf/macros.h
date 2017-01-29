#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_MACROS_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_MACROS_H_

#include "wtf/runtime.h"
#include <string>
#include <algorithm>

#define __INTERNAL_WTF_NAMESPACE ::wtf

// Internal macros.
#define __WTF_INTERNAL_PASTE2(str, line) str##line
#define __WTF_INTERNAL_PASTE1(str, line) __WTF_INTERNAL_PASTE2(str, line)
#define __WTF_INTERNAL_UNIQUE(str) __WTF_INTERNAL_PASTE1(str, __LINE__)

// Enables and disables WTF tracing macros for the current namespace.
// There can be at most one of these in a namespace and its definition must
// be visible at the point where macros are invoked. It is recommended to
// have a header file that includes something like (typically with some
// domain specific preprocessor #ifdef/#ifndef to make it conditional):
//
// #include ".../wtf/macros.h"
//
// namespace foo {
// WTF_NAMESPACE_DISABLE();
// namesapce should_enable {
// WTF_NAMESPACE_ENABLE();
// }
// }
#define WTF_NAMESPACE_ENABLE()                    \
  static constexpr bool kWtfEnabledForNamespace = \
      (__INTERNAL_WTF_NAMESPACE::kMasterEnable && true)

#define WTF_NAMESPACE_DISABLE() \
  static constexpr bool kWtfEnabledForNamespace = false

// Enables WTF tracing for a thread based on a condition. If the thread
// is already enabled for WTF, then this is a no-op. Enabling multiple
// threads with the same name will cause different WTF zones with a machine
// generated suffix to be produced.
// Allowed Scopes: Within a function.
#define WTF_THREAD_ENABLE_IF(condition, name)                              \
  if (condition &&                                                         \
      !__INTERNAL_WTF_NAMESPACE::PlatformGetThreadLocalEventBuffer()) {    \
    __INTERNAL_WTF_NAMESPACE::Runtime::GetInstance()->EnableCurrentThread( \
        name, nullptr, __FILE__);                                          \
  }

// Enables WTF tracing for a thread based on whether the current namespace
// is enabled.
#define WTF_THREAD_ENABLE(name) \
  WTF_THREAD_ENABLE_IF(kWtfEnabledForNamespace, name)

// Same as WTF_THREAD_ENABLE_IF but uses a platform specific mechanism for
// deriving the thread name for the current thread.
#define WTF_AUTO_THREAD_ENABLE_IF(condition) \
  WTF_THREAD_ENABLE_IF(                      \
      condition, __INTERNAL_WTF_NAMESPACE::PlatformGetThreadName().c_str())

// Same as WTF_THREAD_ENABLE_IF conditioned on whether the current namespace
// is enabled.
#define WTF_AUTO_THREAD_ENABLE() \
  WTF_AUTO_THREAD_ENABLE_IF(kWtfEnabledForNamespace)

// Shortcut to trace a no-arg event.
// Allowed Scopes: Within a function.
// This creates an anonymous event anchored to the specific location in the
// code where it is referenced and invokes it.
//
// Example:
//   WTF_EVENT0("MyClass#something_important");
#define WTF_EVENT0(name_spec)                                       \
  static __INTERNAL_WTF_NAMESPACE::EventIf<kWtfEnabledForNamespace> \
      __WTF_INTERNAL_UNIQUE(__wtf_event0__){name_spec};             \
  __WTF_INTERNAL_UNIQUE(__wtf_event0__).Invoke()

// Shortcut to trace an event with arbitrary arguments.
// Allowed Scopes: Within a function.
// This creates an anonymous event anchored to the specific location in the
// code where it is referenced and invokes it.
//
// Example:
//   WTF_EVENT("MyClass#stuff", int, uint32_t)(1, 2);
#define WTF_EVENT(name_spec, ...)                                   \
  static __INTERNAL_WTF_NAMESPACE::EventIf<kWtfEnabledForNamespace, \
                                           __VA_ARGS__>             \
      __WTF_INTERNAL_UNIQUE(__wtf_eventn__){name_spec};             \
  __WTF_INTERNAL_UNIQUE(__wtf_eventn__).Invoke

// Shortcut to trace a no-arg scope.
// Allowed Scopes: Within a function.
// This creates an anonymous scope anchored to the specific location in the
// code where it is referenced. The scope will begin at the point this macro
// is defined and will exit when it goes out of scope.
//
// Example:
//   WTF_SCOPE0("MyClass#MyMethod");
#define WTF_SCOPE0(name_spec)                                             \
  static __INTERNAL_WTF_NAMESPACE::ScopedEventIf<kWtfEnabledForNamespace> \
      __WTF_INTERNAL_UNIQUE(__wtf_scope_event0_){name_spec};              \
  __INTERNAL_WTF_NAMESPACE::AutoScopeIf<kWtfEnabledForNamespace>          \
      __WTF_INTERNAL_UNIQUE(__wtf_scope0_){                               \
          __WTF_INTERNAL_UNIQUE(__wtf_scope_event0_)};                    \
  __WTF_INTERNAL_UNIQUE(__wtf_scope0_).Enter()

// Shortcut to trace a scope with arbitrary arguments.
// Allowed Scopes: Within a function.
// This creates an anonymous scope anchored to the specific location in the
// code where it is referenced. The scope will begin at the point this macro
// is defined and will exit when it goes out of scope.
//
// Example:
//   WTF_SCOPE0("MyClass#MyMethod", int, uint32_t)(1, 2);
#define WTF_SCOPE(name_spec, ...)                                             \
  static __INTERNAL_WTF_NAMESPACE::ScopedEventIf<kWtfEnabledForNamespace,     \
                                                 __VA_ARGS__>                 \
      __WTF_INTERNAL_UNIQUE(__wtf_scope_eventn_){name_spec};                  \
  __INTERNAL_WTF_NAMESPACE::AutoScopeIf<kWtfEnabledForNamespace, __VA_ARGS__> \
      __WTF_INTERNAL_UNIQUE(__wtf_scopen_){                                   \
          __WTF_INTERNAL_UNIQUE(__wtf_scope_eventn_)};                        \
  __WTF_INTERNAL_UNIQUE(__wtf_scopen_).Enter

// Shortcut to trace a function in case you don't care really much about
// the performance. Might add some insignificant overhead.
// It will also replace colon ":" with hash sign "#" in function names
// (see https://github.com/google/tracing-framework/issues/581)
// Allowed Scopes: Within a function.
// Usually you will place this at the very start of a function.
//
// Example:
//   WTF_AUTO_FUNCTION();
#define WTF_AUTO_FUNCTION()                                             \
    static std::string                                                  \
    __WTF_INTERNAL_UNIQUE(__wtf_func_name_) {__PRETTY_FUNCTION__};      \
    do {                                                                \
        __INTERNAL_WTF_NAMESPACE::platform::once_flag __WTF_INTERNAL_UNIQUE(__wtf_replaced_flag_); \
        __INTERNAL_WTF_NAMESPACE::platform::call_once(__WTF_INTERNAL_UNIQUE(__wtf_replaced_flag_), []() { \
                std::replace(__WTF_INTERNAL_UNIQUE(__wtf_func_name_).begin(), \
                             __WTF_INTERNAL_UNIQUE(__wtf_func_name_).end(), ':', '#'); \
            });                                                         \
        WTF_AUTO_THREAD_ENABLE();                                       \
    } while (0);                                                        \
    WTF_SCOPE0(__WTF_INTERNAL_UNIQUE(__wtf_func_name_).c_str())

// Creates a scoped "Task" zone that will be in effect until scope exit.
// This is ideal for thread pools and such which execute many workers where
// you want a specific zone for each type of task the worker is performing
// (versus a zone for each worker thread).
#define WTF_TASK_IF(cond, name)                                       \
  __INTERNAL_WTF_NAMESPACE::ScopedTaskIf<cond> __WTF_INTERNAL_UNIQUE( \
      __wtf_taskn_) {                                                 \
    name                                                              \
  }

// Same as WTF_TASK_IF conditioned on the current namespace.
#define WTF_TASK(name) WTF_TASK_IF(kWtfEnabledForNamespace, name)

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_MACROS_H_
