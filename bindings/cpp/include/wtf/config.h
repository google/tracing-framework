#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_CONFIG_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_CONFIG_H_

namespace wtf {

// Whether default WTF tracing is enabled. Conditioned on the WTF_ENABLE
// define. This impacts default template instantiations. Macros will use
// a namespace specific kWtfEnabledForNamespace const.
#if defined(WTF_ENABLE)
constexpr bool kMasterEnable = true;
#else
constexpr bool kMasterEnable = false;
#endif

}  // namespace wtf

// Whether WTF is enabled for a namespace. Macros condition based on this,
// which if undefined for a namespace, defaults to this global.
constexpr bool kWtfEnabledForNamespace = ::wtf::kMasterEnable;

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_WTF_CONFIG_H_
