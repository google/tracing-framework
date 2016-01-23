package(default_visibility = ["//visibility:public"])

cc_library(
    name = "wtf",
    srcs = [
        "buffer.cc",
        "event.cc",
        "platform.cc",
        "platform_aux_pthread_impl.h",
        "platform_aux_pthread_inl.h",
        "platform_default_impl.h",
        "platform_default_inl.h",
        "platform_myriad2_impl.h",
        "platform_myriad2_inl.h",
        "runtime.cc",
    ],
    hdrs = [
        "buffer.h",
        "config.h",
        "event.h",
        "macros.h",
        "platform.h",
        "runtime.h",
    ],
    deps = [
        "//base",
        "//strings",
        "//third_party/jsoncpp:json",
    ]),
)
