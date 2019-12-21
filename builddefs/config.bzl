# Description:
#  Common configuration options.

COMMON_JS_SUPPRESSIONS = [
    # TODO(benvanik): somehow make all our code typed correctly ;)
    "JSC_UNKNOWN_EXPR_TYPE",

    # TODO(benvanik): go replace naked Object with !Object or ?Object.
    "JSC_IMPLICITLY_NULLABLE_JSDOC",

    # goog.result deprecated in favor of goog.Promise.
    "JSC_DEPRECATED_CLASS_REASON",
    "JSC_DEPRECATED_PROP_REASON",
]

SHARED_CSS_FLAGS = [
    "--allow-unrecognized-functions",
] + select({
    "//:dbg": [
        "--preserve-comments",
        "--pretty-print",
    ],
    "//:fastbuild": [
        "--preserve-comments",
        "--pretty-print",
    ],
    "//:opt": [
        #"--css-renaming-prefix=wtf_",
    ],
})

SHARED_JS_FLAGS = [
    "--summary_detail_level=3",
    "--create_source_map=%outname%.map",
    "--source_map_format=V3",
    "--define=goog.soy.REQUIRE_STRICT_AUTOESCAPE=false",
] + select({
    "//:dbg": [
        "--compilation_level=WHITESPACE_ONLY",
        "--define=goog.DEBUG=true",
        "--define=goog.asserts.ENABLE_ASSERTS=true",
    ],
    "//:fastbuild": [
        "--compilation_level=SIMPLE",
        "--define=goog.DEBUG=true",
        "--define=goog.asserts.ENABLE_ASSERTS=true",
    ],
    "//:opt": [
        "--compilation_level=ADVANCED",
        "--use_types_for_optimization",
        #"--collapse_variable_declarations",
        #"--collapse_anonymous_functions",
        #"--collapse_properties",
        #"--disambiguate_properties",
        # rewrites things to be smaller but likely not better
        # http://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/javascript/jscomp/FunctionRewriter.java
        #"--rewrite_function_expressions=false",
        # slow - may want disabled
        #"--devirtualize_prototype_methods",
        #"--devirtualize_prototype_methods=false",
    ],
})
