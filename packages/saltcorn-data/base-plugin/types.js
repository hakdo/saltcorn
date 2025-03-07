/**
 * Embedded Types definition.
 *
 * More types can be added by plugin store mechanism https://store.saltcorn.com/
 * @category saltcorn-data
 * @module base-plugin/types
 * @subcategory base-plugin
 */

const moment = require("moment");
const {
  input,
  select,
  option,
  text,
  div,
  h3,
  a,
  i,
  button,
  textarea,
  span,
  img,
  text_attr,
  label,
  script,
  domReady,
  section,
  pre,
  code,
  time,
} = require("@saltcorn/markup/tags");
const { contract, is } = require("contractis");
const { radio_group, checkbox_group } = require("@saltcorn/markup/helpers");
const { getState } = require("../db/state");
const { localeDate, localeDateTime } = require("@saltcorn/markup");
const { freeVariables } = require("../models/expression");
const Table = require("../models/table");

const isdef = (x) => (typeof x === "undefined" || x === null ? false : true);

const eqStr = (x, y) => `${x}` === `${y}`;

const number_slider = (type) => ({
  configFields: (field) => [
    ...(!isdef(field.attributes.min)
      ? [{ name: "min", type, required: false }]
      : []),
    ...(!isdef(field.attributes.max)
      ? [{ name: "max", type, required: false }]
      : []),
  ],
  isEdit: true,
  blockDisplay: true,
  run: (nm, v, attrs = {}, cls, required, field) =>
    input({
      type: "range",
      class: ["form-control", cls],
      name: text_attr(nm),
      "data-fieldname": text_attr(field.name),
      disabled: attrs.disabled,
      readonly: attrs.readonly,
      onChange: attrs.onChange,
      step:
        type === "Integer"
          ? 1
          : attrs.decimal_places
          ? Math.pow(10, -attrs.decimal_places)
          : "0.01",
      id: `input${text_attr(nm)}`,
      ...(isdef(attrs.max) && { max: attrs.max }),
      ...(isdef(attrs.min) && { min: attrs.min }),
      ...(isdef(v) && { value: text_attr(v) }),
    }),
});
const range_interval = (type) => ({
  configFields: (field) => [
    ...(!isdef(field.attributes.min)
      ? [{ name: "min", type, required: false }]
      : []),
    ...(!isdef(field.attributes.max)
      ? [{ name: "max", type, required: false }]
      : []),
  ],
  isEdit: false,
  isFilter: true,
  blockDisplay: true,
  /* https://stackoverflow.com/a/31083391 */
  run: (nm, v, attrs = {}, cls, required, field, state = {}) => {
    return section(
      { class: ["range-slider", cls] },
      span({ class: "rangeValues" }),
      input({
        ...(isdef(state[`_gte_${nm}`])
          ? {
              value: text_attr(state[`_gte_${nm}`]),
            }
          : isdef(attrs.min)
          ? { value: text_attr(attrs.min) }
          : {}),
        ...(isdef(attrs.max) && { max: attrs.max }),
        ...(isdef(attrs.min) && { min: attrs.min }),
        type: "range",
        disabled: attrs.disabled,
        readonly: attrs.readonly,
        onChange: `set_state_field('_gte_${nm}', this.value, this)`,
      }),
      input({
        ...(isdef(state[`_lte_${nm}`])
          ? {
              value: text_attr(state[`_lte_${nm}`]),
            }
          : isdef(attrs.max)
          ? { value: text_attr(attrs.max) }
          : {}),
        ...(isdef(attrs.max) && { max: attrs.max }),
        ...(isdef(attrs.min) && { min: attrs.min }),
        type: "range",
        disabled: attrs.disabled,
        readonly: attrs.readonly,
        onChange: `set_state_field('_lte_${nm}', this.value, this)`,
      })
    );
  },
});

const none_available = (required) =>
  required
    ? div(
        { class: "alert alert-danger", role: "alert" },
        i({ class: "fas fa-exclamation-triangle" }),
        "This input is required but there are no available options."
      )
    : i("None available");

const progress_bar = (type) => ({
  configFields: (field) => [
    ...(!isdef(field.attributes.min)
      ? [{ name: "min", type, required: true }]
      : []),
    ...(!isdef(field.attributes.max)
      ? [{ name: "max", type, required: true }]
      : []),
    { name: "bar_color", type: "Color", label: "Bar color" },
    { name: "bg_color", type: "Color", label: "Background color" },
    { name: "px_height", type: "Integer", label: "Height in px" },
  ],
  isEdit: false,
  run: (v, req, attrs = {}) =>
    div(
      {
        style: {
          width: "100%",
          height: `${attrs.px_height || 8}px`,
          backgroundColor: attrs.bg_color || "#777777",
        },
      },
      div({
        style: {
          width: `${(100 * (v - attrs.min)) / (attrs.max - attrs.min)}%`,
          height: `${attrs.px_height || 8}px`,
          backgroundColor: attrs.bar_color || "#0000ff",
        },
      })
    ),
});

const heat_cell = (type) => ({
  configFields: (field) => [
    ...(!isdef(field.attributes.min)
      ? [{ name: "min", type, required: true }]
      : []),
    ...(!isdef(field.attributes.max)
      ? [{ name: "max", type, required: true }]
      : []),
    {
      name: "color_scale",
      type: "String",
      label: "Color scale",
      required: true,
      attributes: { options: ["RedAmberGreen", "Rainbow", "WhiteToRed"] },
    },
    { name: "reverse", type: "Bool", label: "Reverse color scale" },
    { name: "em_height", type: "Integer", label: "Height in em", default: 1.5 },
  ],
  isEdit: false,
  run: (v, req, attrs = {}) => {
    if (typeof v !== "number") return "";
    const pcnt0 = (v - attrs.min) / (attrs.max - attrs.min);
    const pcnt = attrs.reverse ? 1 - pcnt0 : pcnt0;
    const backgroundColor = {
      Rainbow: `hsl(${360 * pcnt},100%, 50%)`,
      RedAmberGreen: `hsl(${100 * pcnt},100%, 50%)`,
      WhiteToRed: `hsl(0,100%, ${100 * (1 - pcnt / 2)}%)`,
    }[attrs.color_scale];
    return div(
      {
        class: "px-2",
        style: {
          width: "100%",
          height: `${attrs.em_height || 1}em`,
          backgroundColor,
        },
      },
      text(v)
    );
  },
});

const number_limit = (direction) => ({
  isEdit: false,
  isFilter: true,
  blockDisplay: true,
  configFields: [
    { name: "stepper_btns", label: "Stepper buttons", type: "Bool" },
  ],
  run: (nm, v, attrs = {}, cls, required, field, state = {}) => {
    const onChange = `set_state_field('_${direction}_${nm}', this.value, this)`;
    return attrs?.stepper_btns
      ? number_stepper(
          undefined,
          isdef(state[`_${direction}_${nm}`])
            ? text_attr(state[`_${direction}_${nm}`])
            : undefined,
          {
            ...attrs,
            onChange: `set_state_field('_${direction}_${nm}', $('#numlim_${nm}_${direction}').val(), this)`,
          },
          cls,
          undefined,
          `numlim_${nm}_${direction}`
        )
      : input({
          type: "number",
          class: ["form-control", cls],
          disabled: attrs.disabled,
          readonly: attrs.readonly,
          onChange,
          step: 1,
          ...(attrs.max && { max: attrs.max }),
          ...(attrs.min && { min: attrs.min }),
          ...(isdef(state[`_${direction}_${nm}`]) && {
            value: text_attr(state[`_${direction}_${nm}`]),
          }),
        });
  },
});

const float_number_limit = (direction) => ({
  isEdit: false,
  isFilter: true,
  blockDisplay: true,
  run: (nm, v, attrs = {}, cls, required, field, state = {}) =>
    input({
      type: "number",
      class: ["form-control", cls],
      disabled: attrs.disabled,
      readonly: attrs.readonly,
      onChange: `set_state_field('_${direction}_${nm}', this.value, this)`,
      step: attrs.decimal_places ? Math.pow(10, -attrs.decimal_places) : "0.01",
      ...(attrs.max && { max: attrs.max }),
      ...(attrs.min && { min: attrs.min }),
      ...(isdef(state[`_${direction}_${nm}`]) && {
        value: text_attr(state[`_${direction}_${nm}`]),
      }),
    }),
});

const number_stepper = (name, v, attrs, cls, fieldname, id) =>
  div(
    { class: "input-group" },
    button(
      {
        class: "btn btn-outline-secondary",
        type: "button",
        onClick: `$('#${id}').val(Math.max(${
          isdef(attrs.min) ? attrs.min : "-Infinity"
        },+$('#${id}').val()-1));${attrs.onChange || ""}`,
      },
      i({ class: "fas fa-minus" })
    ),
    input({
      type: "number",
      class: ["form-control", "hideupdownbtns", cls],
      disabled: attrs.disabled,
      readonly: attrs.readonly,
      "data-fieldname": fieldname,
      name,
      onChange: attrs.onChange,
      id,
      step: "1",
      ...(attrs.max && { max: attrs.max }),
      ...(attrs.min && { min: attrs.min }),
      ...(isdef(v) && { value: text_attr(v) }),
    }),
    button(
      {
        class: "btn btn-outline-secondary",
        type: "button",
        onClick: `$('#${id}').val(Math.min(${
          isdef(attrs.max) ? attrs.max : "Infinity"
        },+$('#${id}').val()+1));${attrs.onChange || ""}`,
      },
      i({ class: "fas fa-plus" })
    )
  );

/**
 * @param {string} v
 * @param {string} optsStr
 * @returns {string[]}
 */
const getStrOptions = (v, optsStr) =>
  typeof optsStr === "string"
    ? optsStr
        .split(",")
        .map((o) => o.trim())
        .map((o) =>
          option(
            { value: text_attr(o), ...(eqStr(v, o) && { selected: true }) },
            text_attr(o)
          )
        )
    : optsStr.map((o, ix) =>
        o && typeof o.name !== "undefined" && typeof o.label !== "undefined"
          ? option(
              {
                value: o.name,
                ...((eqStr(v, o.name) ||
                  (ix === 0 && typeof v === "undefined" && o.disabled)) && {
                  selected: true,
                }),
                ...(o.disabled && { disabled: true }),
              },
              o.label
            )
          : option({ value: o, ...(eqStr(v, o) && { selected: true }) }, o)
      );

const join_fields_in_formula = (fml) => {
  if (!fml) return [];
  return [...freeVariables(fml)];
};

/**
 * string type
 * @namespace
 * @category saltcorn-data
 * @subcategory types / string
 */
const string = {
  /** @type {string} */
  name: "String",
  /** @type {string} */
  sql_name: "text",
  /**
   * @param {object} param
   * @returns {object}
   */
  attributes: ({ table }) => {
    const strFields =
      table &&
      table.fields.filter(
        (f) =>
          (f.type || {}).name === "String" &&
          !(f.attributes && f.attributes.localizes_field)
      );
    const locales = Object.keys(
      getState().getConfig("localizer_languages", {})
    );
    return [
      {
        name: "options",
        label: "Options",
        type: "String",
        required: false,
        sublabel:
          'Use this to restrict your field to a list of options (separated by commas). For instance, if the permissible values are "Red", "Green" and "Blue", enter "Red, Green, Blue" here. Leave blank if the string can hold any value.',
      },
      {
        name: "min_length",
        label: "Min length",
        type: "Integer",
        required: false,
        sublabel: "The minimum number of characters in the string",
        attributes: { asideNext: true },
      },
      {
        name: "max_length",
        label: "Max length",
        type: "Integer",
        required: false,
        sublabel: "The maximum number of characters in the string",
      },
      {
        name: "regexp",
        type: "String",
        label: "Regular expression",
        required: false,
        sublabel: "String value must match regular expression",
        validator(s) {
          if (!is_valid_regexp(s)) return "Not a valid Regular Expression";
        },
        attributes: { asideNext: true },
      },
      {
        name: "re_invalid_error",
        label: "Error message",
        type: "String",
        required: false,
        sublabel: "Error message when regular expression does not match",
      },

      ...(table
        ? [
            {
              name: "localizes_field",
              label: "Translation of",
              sublabel:
                "This is a translation of a different field in a different language",
              type: "String",
              attributes: {
                options: strFields.map((f) => f.name),
              },
            },
            {
              name: "locale",
              label: "Locale",
              sublabel: "Language locale of translation",
              input_type: "select",
              options: locales,
              showIf: { localizes_field: strFields.map((f) => f.name) },
            },
          ]
        : []),
    ];
  },
  /**
   * @param {object} opts
   * @param {string|undefined} opts.options
   * @returns {boolean}
   */
  contract: ({ options }) =>
    typeof options === "string"
      ? is.one_of(options.split(","))
      : typeof options === "undefined"
      ? is.str
      : is.one_of(options.map((o) => (typeof o === "string" ? o : o.name))),
  /**
   * @namespace
   * @category saltcorn-data
   * @subcategory types / string
   */
  fieldviews: {
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / string
     */
    as_text: { isEdit: false, run: (s) => text_attr(s || "") },
    preFormatted: {
      isEdit: false,
      run: (s) =>
        s ? span({ style: "white-space:pre-wrap" }, text_attr(s || "")) : "",
    },
    code: {
      isEdit: false,
      run: (s) => (s ? pre(code(text_attr(s || ""))) : ""),
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / string
     */
    as_link: {
      configFields: [
        {
          name: "link_title",
          label: "Link title",
          type: "String",
          sublabel: "Optional. If blank, label is URL",
        },
      ],
      isEdit: false,
      run: (s, req, attrs = {}) =>
        s
          ? a({ href: text(s || "") }, text_attr(attrs?.link_title || s || ""))
          : "",
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / string
     */
    img_from_url: {
      isEdit: false,
      run: (s, req, attrs) => img({ src: text(s || ""), style: "width:100%" }),
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / string
     */
    as_header: { isEdit: false, run: (s) => h3(text_attr(s || "")) },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / string
     */
    edit: {
      isEdit: true,
      blockDisplay: true,

      configFields: (field) => [
        ...(field.attributes.options &&
        field.attributes.options.length > 0 &&
        !field.required
          ? [
              {
                name: "neutral_label",
                label: "Neutral label",
                type: "String",
              },
              {
                name: "force_required",
                label: "Required",
                sublabel:
                  "User must select a value, even if the table field is not required",
                type: "Bool",
              },
            ]
          : []),
        {
          name: "placeholder",
          label: "Placeholder",
          type: "String",
        },
        {
          name: "input_type",
          label: "Input type",
          input_type: "select",
          options: ["text", "email", "url", "tel", "password"],
        },
      ],
      run: (nm, v, attrs, cls, required, field) =>
        attrs.options && (attrs.options.length > 0 || !required)
          ? attrs.readonly
            ? input({
                type: "text",
                class: ["form-control", "form-select", cls],
                name: text_attr(nm),
                "data-fieldname": text_attr(field.name),
                id: `input${text_attr(nm)}`,
                onChange: attrs.onChange,
                readonly: attrs.readonly,
              })
            : select(
                {
                  class: [
                    "form-control",
                    "form-select",
                    cls,
                    attrs.selectizable ? "selectizable" : false,
                  ],
                  name: text_attr(nm),
                  "data-fieldname": text_attr(field.name),
                  id: `input${text_attr(nm)}`,
                  disabled: attrs.disabled,
                  onChange: attrs.onChange,
                },
                required || attrs.force_required
                  ? getStrOptions(v, attrs.options)
                  : [
                      option({ value: "" }, attrs.neutral_label || ""),
                      ...getStrOptions(v, attrs.options),
                    ]
              )
          : attrs.options
          ? none_available(required)
          : attrs.calcOptions
          ? select(
              {
                class: ["form-control", "form-select", cls],
                name: text_attr(nm),
                disabled: attrs.disabled,
                "data-fieldname": text_attr(field.name),
                id: `input${text_attr(nm)}`,
                onChange: attrs.onChange,
                "data-selected": v,
                "data-calc-options": encodeURIComponent(
                  JSON.stringify(attrs.calcOptions)
                ),
              },
              option({ value: "" }, "")
            )
          : input({
              type: attrs.input_type || "text",
              disabled: attrs.disabled,
              readonly: attrs.readonly,
              class: ["form-control", cls],
              placeholder: attrs.placeholder,
              onChange: attrs.onChange,
              "data-fieldname": text_attr(field.name),
              name: text_attr(nm),
              required: !!(required || attrs.force_required),
              maxlength: isdef(attrs.max_length) && attrs.max_length,
              minlength: isdef(attrs.min_length) && attrs.min_length,
              pattern: !!attrs.regexp && attrs.regexp,
              title:
                !!attrs.re_invalid_error &&
                !!attrs.regexp &&
                attrs.re_invalid_error,
              id: `input${text_attr(nm)}`,
              ...(isdef(v) && { value: text_attr(v) }),
            }),
    },
    fill_formula_btn: {
      isEdit: true,
      blockDisplay: true,

      configFields: [
        {
          name: "formula",
          label: "Formula",
          type: "String",
        },
        {
          name: "label",
          label: "Button label",
          type: "String",
        },
        {
          name: "make_unique",
          label: "Make unique after fill",
          type: "Bool",
        },
        {
          name: "include_space",
          label: "Include space",
          type: "Bool",
          showIf: { make_unique: true },
        },
        {
          name: "start_from",
          label: "Start from",
          type: "Integer",
          default: 0,
          showIf: { make_unique: true },
        },
        {
          name: "always_append",
          label: "Always append",
          type: "Bool",
          showIf: { make_unique: true },
        },
        {
          name: "char_type",
          label: "Append character type",
          input_type: "select",
          options: ["Digits", "Lowercase Letters", "Uppercase Letters"],
          showIf: { make_unique: true },
        },
      ],
      run: (nm, v, attrs, cls, required, field) =>
        div(
          { class: "input-group" },
          input({
            type: attrs.input_type || "text",
            disabled: attrs.disabled,
            readonly: attrs.readonly,
            class: ["form-control", cls],
            placeholder: attrs.placeholder,
            onChange: attrs.onChange,
            "data-fieldname": text_attr(field.name),
            name: text_attr(nm),
            id: `input${text_attr(nm)}`,
            ...(isdef(v) && { value: text_attr(v) }),
          }),
          button(
            {
              class: "btn btn-secondary",
              type: "button",
              "data-formula": encodeURIComponent(attrs?.formula),
              "data-formula-free-vars": encodeURIComponent(
                JSON.stringify(join_fields_in_formula(attrs?.formula))
              ),
              "data-formula-table": encodeURIComponent(
                JSON.stringify(Table.findOne(field.table_id))
              ),
              onClick:
                "fill_formula_btn_click(this" +
                (attrs.make_unique
                  ? `,()=>make_unique_field('input${text_attr(nm)}', ${
                      field.table_id
                    }, '${field.name}',  $('#input${text_attr(
                      nm
                    )}'), ${!!attrs.include_space}, ${
                      attrs.start_from || 0
                    }, ${!!attrs.always_append}, '${attrs.char_type}')`
                  : "") +
                ")",
            },
            attrs?.label || "Fill"
          )
        ),
    },
    make_unique: {
      isEdit: true,
      blockDisplay: true,

      configFields: [
        {
          name: "placeholder",
          label: "Placeholder",
          type: "String",
        },
        {
          name: "input_type",
          label: "Input type",
          input_type: "select",
          options: ["text", "email", "url", "tel", "password"],
        },
        {
          name: "include_space",
          label: "Include space",
          type: "Bool",
        },
        {
          name: "start_from",
          label: "Start from",
          type: "Integer",
          default: 0,
        },
        {
          name: "always_append",
          label: "Always append",
          type: "Bool",
        },
        {
          name: "char_type",
          label: "Append character type",
          input_type: "select",
          options: ["Digits", "Lowercase Letters", "Uppercase Letters"],
        },
      ],
      run: (nm, v, attrs, cls, required, field) =>
        input({
          type: attrs.input_type || "text",
          disabled: attrs.disabled,
          readonly: attrs.readonly,
          class: ["form-control", cls],
          placeholder: attrs.placeholder,
          onChange: attrs.onChange,
          "data-fieldname": text_attr(field.name),
          name: text_attr(nm),
          id: `input${text_attr(nm)}`,
          ...(isdef(v) && { value: text_attr(v) }),
        }) +
        script(
          domReady(
            `make_unique_field('input${text_attr(nm)}', ${field.table_id}, '${
              field.name
            }', $('#input${text_attr(nm)}'), ${attrs.include_space}, ${
              attrs.start_from
            }, ${attrs.always_append}, ${JSON.stringify(attrs.char_type)})`
          )
        ),
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / string
     */
    textarea: {
      isEdit: true,
      blockDisplay: true,

      run: (nm, v, attrs, cls, required, field) =>
        textarea(
          {
            class: ["form-control", cls],
            name: text_attr(nm),
            "data-fieldname": text_attr(field.name),
            disabled: attrs.disabled,
            onChange: attrs.onChange,
            required: !!required,
            maxlength: isdef(attrs.max_length) && attrs.max_length,
            minlength: isdef(attrs.min_length) && attrs.min_length,
            id: `input${text_attr(nm)}`,
            rows: 5,
          },
          text(v) || ""
        ),
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / string
     */
    radio_group: {
      isEdit: true,
      configFields: [
        {
          type: "Bool",
          name: "inline",
          label: "Inline",
        },
      ],
      run: (nm, v, attrs, cls, required, field) =>
        attrs.options
          ? radio_group({
              class: cls,
              name: text_attr(nm),
              disabled: attrs.disabled,
              inline: attrs.inline,
              onChange: attrs.onChange,
              required: !!required,
              options: Array.isArray(attrs.options)
                ? attrs.options
                : attrs.options.split(",").map((o) => o.trim()),
              value: v,
            })
          : none_available(required),
    },
    checkbox_group: {
      isEdit: false,
      isFilter: true,
      configFields: [
        {
          type: "Bool",
          name: "inline",
          label: "Inline",
        },
      ],
      run: (nm, v, attrs, cls, required, field) =>
        attrs && attrs.options
          ? checkbox_group({
              class: cls,
              name: text_attr(nm),
              disabled: attrs.disabled,
              inline: attrs.inline,
              options: Array.isArray(attrs.options)
                ? attrs.options
                : attrs.options.split(",").map((o) => o.trim()),
              value: v,
            })
          : i("None available"),
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / string
     */
    password: {
      isEdit: true,
      blockDisplay: true,

      run: (nm, v, attrs, cls, required, field) =>
        input({
          type: "password",
          disabled: attrs.disabled,
          readonly: attrs.readonly,
          class: ["form-control", cls],
          "data-fieldname": text_attr(field.name),
          onChange: attrs.onChange,
          name: text_attr(nm),
          id: `input${text_attr(nm)}`,
          ...(isdef(v) && { value: text_attr(v) }),
        }),
    },
  },
  /**
   * @param {*} v
   * @returns {string|undefined}
   */
  read: (v) => {
    switch (typeof v) {
      case "string":
        //PG dislikes null bytes
        return v.replace(/\0/g, "");
      default:
        return undefined;
    }
  },
  /**
   * @namespace
   * @category saltcorn-data
   * @subcategory types / string
   */
  presets: {
    /**
     * @param {object} opts
     * @param {object} opts.req
     * @returns {object}
     */
    IP: ({ req }) => req.ip,
    /**
     * @param {object} opts
     * @param {object} opts.req
     * @returns {object}
     */
    SessionID: ({ req }) => req.sessionID || req.cookies["express:sess"],
  },
  /**
   * @param {object} param
   * @returns {object|true}
   */
  validate:
    ({ min_length, max_length, regexp, re_invalid_error }) =>
    (x) => {
      if (!x || typeof x !== "string") return true; //{ error: "Not a string" };
      if (isdef(min_length) && x.length < min_length)
        return { error: `Must be at least ${min_length} characters` };
      if (isdef(max_length) && x.length > max_length)
        return { error: `Must be at most ${max_length} characters` };
      if (isdef(regexp) && !new RegExp(regexp).test(x))
        return {
          error: re_invalid_error || `Does not match regular expression`,
        };
      return true;
    },

  /**
   * @param {object} param
   * @returns {object}
   */
  validate_attributes: ({ min_length, max_length, regexp }) =>
    (!isdef(min_length) || !isdef(max_length) || max_length >= min_length) &&
    (!isdef(regexp) || is_valid_regexp(regexp)),
};

/**
 * @param {string} s
 * @returns {boolean}
 */
const is_valid_regexp = (s) => {
  try {
    new RegExp(s);
    return true;
  } catch {
    return false;
  }
};

/**
 * Integer type
 * @namespace
 * @category saltcorn-data
 * @subcategory types / int
 */
const int = {
  /** @type {string} */
  name: "Integer",
  /** @type {string} */
  sql_name: "int",
  /**
   * @param {object} opts
   * @param {number} opts.min
   * @param {number} opts.max
   * @returns {boolean}
   */
  contract: ({ min, max }) => is.integer({ lte: max, gte: min }),
  primaryKey: { sql_type: "serial" },
  /**
   * @namespace
   * @category saltcorn-data
   * @subcategory types / int
   */
  fieldviews: {
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / int
     */
    show: { isEdit: false, run: (s) => text(s) },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / int
     */
    edit: {
      isEdit: true,
      blockDisplay: true,
      configFields: [
        { name: "stepper_btns", label: "Stepper buttons", type: "Bool" },
      ],
      run: (nm, v, attrs, cls, required, field) => {
        const id = `input${text_attr(nm)}`;
        const name = text_attr(nm);
        return attrs?.stepper_btns
          ? number_stepper(name, v, attrs, cls, text_attr(field.name), id)
          : input({
              type: attrs?.type || "number",
              inputmode: attrs?.inputmode,
              pattern: attrs?.pattern,
              autocomplete: attrs?.autocomplete,
              class: ["form-control", cls],
              disabled: attrs.disabled,
              readonly: attrs.readonly,
              "data-fieldname": text_attr(field.name),
              name,
              onChange: attrs.onChange,
              id,
              step: "1",
              required: !!required,
              ...(attrs.max && { max: attrs.max }),
              ...(attrs.min && { min: attrs.min }),
              ...(isdef(v) && { value: text_attr(v) }),
            });
      },
    },
    number_slider: number_slider("Integer"),
    range_interval: range_interval("Integer"),
    progress_bar: progress_bar("Integer"),
    heat_cell: heat_cell("Integer"),
    above_input: number_limit("gte"),
    below_input: number_limit("lte"),
    show_star_rating: {
      configFields: (field) => [
        ...(!isdef(field.attributes.min)
          ? [{ name: "min", type: "Integer", required: true, default: 1 }]
          : []),
        ...(!isdef(field.attributes.max)
          ? [{ name: "max", type: "Integer", required: true, default: 5 }]
          : []),
      ],
      isEdit: false,
      blockDisplay: true,
      run: (v, req, attrs = {}) =>
        div(
          Array.from(
            { length: attrs.max - attrs.min + 1 },
            (_, i) => i + attrs.min
          ).map((starVal) =>
            i({
              class: "fas fa-star",
              style: { color: starVal <= v ? "#ffc107" : "#ddd" },
            })
          )
        ),
    },
    edit_star_rating: {
      configFields: (field) => [
        ...(!isdef(field.attributes.min)
          ? [{ name: "min", type: "Integer", required: true, default: 1 }]
          : []),
        ...(!isdef(field.attributes.max)
          ? [{ name: "max", type: "Integer", required: true, default: 5 }]
          : []),
      ],
      isEdit: true,
      blockDisplay: true,
      run: (nm, v, attrs = {}, cls, required, field, state = {}) => {
        //https://codepen.io/pezmotion/pen/RQERdm
        return div(
          { class: "editStarRating" },
          Array.from(
            { length: attrs.max - attrs.min + 1 },
            (_, i) => attrs.max - i
          ).map(
            (starVal) =>
              input({
                id: `input${text_attr(nm)}-${starVal}`,
                type: "radio",
                name: text_attr(nm),
                value: starVal,
                checked: v === starVal,
              }) +
              label(
                { for: `input${text_attr(nm)}-${starVal}` },
                i({ class: "fas fa-star" })
              )
          )
        );
      },
    },
  },
  /** @type {object[]}  */
  attributes: [
    { name: "min", label: "Minimum", type: "Integer", required: false },
    { name: "max", label: "Maximum", type: "Integer", required: false },
  ],
  /**
   * @param {object} param
   * @returns {boolean}
   */
  validate_attributes: ({ min, max }) =>
    !isdef(min) || !isdef(max) || max > min,
  /**
   * @param {object} v
   * @returns {object}
   */
  read: (v) => {
    switch (typeof v) {
      case "number":
        return Math.round(v);
      case "string":
        if (v === "") return undefined;
        const parsed = +v;
        return isNaN(parsed) ? undefined : parsed;
      default:
        return undefined;
    }
  },
  /**
   * @param {object} param
   * @returns {boolean}
   */
  validate:
    ({ min, max }) =>
    (x) => {
      if (isdef(min) && x < min) return { error: `Must be ${min} or higher` };
      if (isdef(max) && x > max) return { error: `Must be ${max} or less` };
      return true;
    },
};

/**
 * Color Type
 * @namespace color
 * @category saltcorn-data
 * @subcategory types / color
 */
const color = {
  /** @type {string} */
  name: "Color",
  /** @type {string} */
  sql_name: "text",
  /**
   * @returns {function}
   */
  contract: () => is.str,
  /**
   * @namespace
   * @category saltcorn-data
   * @subcategory types / color
   */
  fieldviews: {
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / color
     */
    show: {
      isEdit: false,
      run: (s) =>
        s
          ? div({
              class: "color-type-show",
              style: `background: ${s};`,
            })
          : "",
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / color
     */
    edit: {
      isEdit: true,
      blockDisplay: true,

      run: (nm, v, attrs, cls, required, field) =>
        input({
          type: "color",
          class: ["form-control", cls],
          disabled: attrs.disabled,
          readonly: attrs.readonly,
          onChange: attrs.onChange,
          "data-fieldname": text_attr(field.name),
          name: text_attr(nm),
          id: `input${text_attr(nm)}`,
          ...(isdef(v) && { value: text_attr(v) }),
        }),
    },
  },
  /** @type {object[]} */
  attributes: [],
  /**
   * @param {object} v
   * @returns {object}
   */
  read: (v) => {
    switch (typeof v) {
      case "string":
        return v;
      default:
        return undefined;
    }
  },
  /**
   * @returns {boolean}
   */
  validate: () => (x) => {
    return true;
  },
};

/**
 * Float type
 * @namespace
 * @category saltcorn-data
 * @subcategory types / float
 */
const float = {
  /** @type {string} */
  name: "Float",
  /** @type {string} */
  sql_name: "double precision",
  /**
   * @param {object} opts
   * @param {number} opts.min
   * @param {number} opts.max
   * @returns {function}
   */
  contract: ({ min, max }) => is.number({ lte: max, gte: min }),
  /**
   * @namespace
   * @category saltcorn-data
   * @subcategory types / float
   */
  fieldviews: {
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / float
     */
    show: { isEdit: false, run: (s) => text(s) },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / float
     */
    edit: {
      isEdit: true,
      blockDisplay: true,

      run: (nm, v, attrs, cls, required, field) =>
        input({
          type: "number",
          class: ["form-control", cls],
          name: text_attr(nm),
          "data-fieldname": text_attr(field.name),
          disabled: attrs.disabled,
          readonly: attrs.readonly,
          onChange: attrs.onChange,
          required: !!required,
          step: attrs.decimal_places
            ? Math.pow(10, -attrs.decimal_places)
            : "0.01",
          id: `input${text_attr(nm)}`,
          ...(attrs.max && { max: attrs.max }),
          ...(attrs.min && { min: attrs.min }),
          ...(isdef(v) && { value: text_attr(v) }),
        }),
    },
    number_slider: number_slider("Float"),
    range_interval: range_interval("Float"),
    progress_bar: progress_bar("Float"),
    heat_cell: heat_cell("Float"),
    above_input: float_number_limit("gte"),
    below_input: float_number_limit("lte"),
  },
  /** @type {object[]} */
  attributes: [
    { name: "min", type: "Float", required: false },
    { name: "max", type: "Float", required: false },
    { name: "units", type: "String", required: false },
    { name: "decimal_places", type: "Integer", required: false },
  ],
  /**
   * @param {object} v
   * @returns {number|string|undefined}
   */
  read: (v) => {
    switch (typeof v) {
      case "number":
        return v;
      case "string":
        const stripped = v.replace(/[^0-9.\-e]+/g, "");
        if (!stripped) return undefined;
        const parsed = Number(stripped);
        return isNaN(parsed) ? undefined : parsed;
      default:
        return undefined;
    }
  },
  /**
   * @param {object} param
   * @returns {object|boolean}
   */
  validate:
    ({ min, max }) =>
    (x) => {
      if (isdef(min) && x < min) return { error: `Must be ${min} or higher` };
      if (isdef(max) && x > max) return { error: `Must be ${max} or less` };
      return true;
    },
};

/**
 * @param {object} req
 * @returns {string|undefined}
 */
const locale = (req) => {
  //console.log(req && req.getLocale ? req.getLocale() : undefined);
  return req && req.getLocale ? req.getLocale() : undefined;
};

/**
 * @param {*} x
 * @returns {*}
 */
const logit = (x) => {
  console.log(x);
  return x;
};

/**
 * Date type
 * @namespace
 * @category saltcorn-data
 * @subcategory types / date
 */
const date = {
  /** @type {string} */
  name: "Date",
  /** @type {string} */
  sql_name: "timestamptz",
  /**
   * @returns {function}
   */
  contract: () => is.date,
  /** @type {object[]} */
  attributes: [],
  /**
   * @namespace
   * @category saltcorn-data
   * @subcategory types / date
   */
  fieldviews: {
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / date
     */
    show: {
      isEdit: false,
      run: (d, req) =>
        typeof d === "string"
          ? localeDateTime(new Date(d))
          : d && d.toISOString
          ? localeDateTime(d)
          : "",
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / date
     */
    showDay: {
      isEdit: false,
      run: (d, req) =>
        typeof d === "string"
          ? localeDate(new Date(d))
          : d && d.toISOString
          ? localeDate(d)
          : "",
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / date
     */
    format: {
      isEdit: false,
      configFields: [
        {
          name: "format",
          label: "Format",
          type: "String",
          sublabel: "moment.js format specifier",
        },
      ],
      run: (d, req, options) => {
        if (!d) return "";
        return time(
          {
            datetime: new Date(d).toISOString(),
            "locale-date-format": encodeURIComponent(
              JSON.stringify(options?.format)
            ),
          },
          moment(d).format(options?.format)
        );
      },
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / date
     */
    relative: {
      isEdit: false,
      run: (d, req) => {
        if (!d) return "";
        const loc = locale(req);
        if (loc) return text(moment(d).locale(loc).fromNow());
        else return text(moment(d).fromNow());
      },
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / date
     */
    yearsAgo: {
      isEdit: false,
      run: (d, req) => {
        if (!d) return "";
        return text(moment.duration(new Date() - d).years());
      },
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / date
     */
    edit: {
      isEdit: true,
      blockDisplay: true,

      run: (nm, v, attrs, cls, required, field) =>
        input({
          type: "text",
          class: ["form-control", cls],
          "data-fieldname": text_attr(field.name),
          name: text_attr(nm),
          onChange: attrs.onChange,
          disabled: attrs.disabled,
          readonly: attrs.readonly,
          required: !!required,
          id: `input${text_attr(nm)}`,
          ...(isdef(v) && {
            value: text_attr(
              typeof v === "string"
                ? new Date(v).toLocaleString(attrs.locale)
                : v.toLocaleString(attrs.locale)
            ),
          }),
        }),
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / date
     */
    editDay: {
      isEdit: true,
      blockDisplay: true,

      run: (nm, v, attrs, cls, required, field) =>
        input({
          type: "text",
          class: ["form-control", cls],
          "data-fieldname": text_attr(field.name),
          name: text_attr(nm),
          onChange: attrs.onChange,
          readonly: attrs.readonly,
          disabled: attrs.disabled,
          required: !!required,
          id: `input${text_attr(nm)}`,
          ...(isdef(v) && {
            value: text_attr(
              typeof v === "string"
                ? new Date(v).toLocaleDateString(attrs.locale)
                : v.toLocaleDateString(attrs.locale)
            ),
          }),
        }),
    },
  },
  /**
   * @namespace
   * @category saltcorn-data
   * @subcategory types / date
   */
  presets: {
    Now: () => new Date(),
  },
  /**
   * @param {object} v
   * @param {object} attrs
   * @returns {object}
   */
  read: (v, attrs) => {
    if (v instanceof Date && !isNaN(v)) return v;
    if (typeof v === "string") {
      if (attrs && attrs.locale) {
        const d = moment(v, "L LT", attrs.locale).toDate();
        if (d instanceof Date && !isNaN(d)) return d;
      }
      const d = new Date(v);
      if (d instanceof Date && !isNaN(d)) return d;
      else return null;
    }
  },
  /**
   * @param {object} param
   * @returns {boolean}
   */
  validate: () => (v) => v instanceof Date && !isNaN(v),
};

/**
 * Boolean Type
 * @namespace
 * @category saltcorn-data
 * @subcategory types / bool
 */
const bool = {
  /** @type {string} */
  name: "Bool",
  /** @type {string} */
  sql_name: "boolean",
  /**
   * @returns {function}
   */
  contract: () => is.bool,
  /**
   * @namespace
   * @category saltcorn-data
   * @subcategory types / bool
   */
  fieldviews: {
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / bool
     */
    show: {
      isEdit: false,
      run: (v) =>
        typeof v === "undefined" || v === null
          ? ""
          : v
          ? i({
              class: "fas fa-lg fa-check-circle text-success",
            })
          : i({
              class: "fas fa-lg fa-times-circle text-danger",
            }),
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / bool
     */
    checkboxes: {
      isEdit: false,
      run: (v) =>
        v === true
          ? input({ disabled: true, type: "checkbox", checked: true })
          : v === false
          ? input({ type: "checkbox", disabled: true })
          : "",
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / bool
     */
    TrueFalse: {
      isEdit: false,
      run: (v) => (v === true ? "True" : v === false ? "False" : ""),
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / bool
     */
    edit: {
      isEdit: true,
      configFields: [
        {
          name: "size",
          label: "Size",
          type: "String",
          attributes: {
            options: ["normal", "medium", "large"],
          },
        },
      ],
      run: (nm, v, attrs, cls, required, field) => {
        const onChange =
          attrs.isFilter && v
            ? `unset_state_field('${nm}', this)`
            : attrs.onChange;
        return input({
          class: ["me-2 mt-1", attrs?.size || null, cls],
          "data-fieldname": text_attr(field.name),
          type: "checkbox",
          onChange,
          readonly: attrs.readonly,
          name: text_attr(nm),
          id: `input${text_attr(nm)}`,
          ...(v && { checked: true }),
          ...(attrs.disabled && { onclick: "return false;" }),
        });
      },
    },
    switch: {
      isEdit: true,
      run: (nm, v, attrs, cls, required, field) => {
        const onChange =
          attrs.isFilter && v
            ? `unset_state_field('${nm}', this)`
            : attrs.onChange;
        return span(
          { class: "form-switch" },
          input({
            class: ["form-check-input", cls],
            "data-fieldname": text_attr(field.name),
            type: "checkbox",
            onChange,
            readonly: attrs.readonly,
            role: "switch",
            name: text_attr(nm),
            id: `input${text_attr(nm)}`,
            ...(v && { checked: true }),
            ...(attrs.disabled && { onclick: "return false;" }),
          })
        );
      },
    },
    /**
     * @namespace
     * @category saltcorn-data
     * @subcategory types / bool
     */
    tristate: {
      isEdit: true,
      run: (nm, v, attrs, cls, required, field) =>
        attrs.disabled
          ? !(!isdef(v) || v === null)
            ? ""
            : v
            ? "T"
            : "F"
          : input({
              type: "hidden",
              "data-fieldname": text_attr(field.name),
              name: text_attr(nm),
              id: `input${text_attr(nm)}`,
              value: !isdef(v) || v === null ? "?" : v ? "on" : "off",
            }) +
            button(
              {
                onClick: `tristateClick('${text_attr(nm)}')`,
                type: "button",
                id: `trib${text_attr(nm)}`,
              },
              !isdef(v) || v === null ? "?" : v ? "T" : "F"
            ),
    },
  },
  /** @type {object[]} */
  attributes: [],
  /**
   * @param {*} rec
   * @param {string} name
   * @returns {boolean|null}
   */
  readFromFormRecord: (rec, name) => {
    if (!rec[name]) return false;
    if (["undefined", "false", "off"].includes(rec[name])) return false;
    if (rec[name] === "?") return null;
    return rec[name] ? true : false;
  },
  /**
   * @param {object} v
   * @returns {boolean|null}
   */
  read: (v) => {
    switch (typeof v) {
      case "string":
        if (["TRUE", "T", "ON"].includes(v.toUpperCase())) return true;
        if (v === "?") return null;
        else return false;
      default:
        if (v === null) return null;
        return v ? true : false;
    }
  },
  /**
   * @param {object} v
   * @returns {object}
   */
  readFromDB: (v) => !!v,
  /**
   * @param {object} v
   * @returns {object}
   */
  listAs: (v) => JSON.stringify(v),
  /**
   * @returns {boolean}
   */
  validate: () => (x) => true,
};

module.exports = { string, int, bool, date, float, color };
