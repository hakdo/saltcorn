const isdef = x => (typeof x === "undefined" ? false : true);

const string = {
  name: "String",
  sql_name: "text",
  attributes: [
    { name: "match", type: "String", required: false }
    //{ name: "options", type: "String[]", required: false }
  ],
  editAs: (nm, v, cls) =>
    `<input type="text" class="form-control ${cls ||
      ""}" name="${nm}" id="input${nm}" ${v ? `value="${v}"` : ""}>`,
  read: v => {
    switch (typeof v) {
      case "string":
        return v;
      default:
        return undefined;
    }
  },
  validate: ({ match }) => x => true
};

const int = {
  name: "Integer",
  sql_name: "text",
  editAs: (nm, v, cls) =>
    `<input type="number" class="form-control ${cls ||
      ""}" name="${nm}" id="input${nm}" ${v ? `value="${v}"` : ""}>`,
  attributes: [
    { name: "max", type: "Integer", required: false },
    { name: "min", type: "Integer", required: false }
  ],
  read: v => {
    switch (typeof v) {
      case "number":
        return v;
      case "string":
        const parsed = parseInt(v);
        return isNaN(parsed) ? undefined : parsed;
      default:
        return undefined;
    }
  },
  validate: ({ min, max }) => x => {
    if (isdef(min) && x < min) return { error: `Must be ${min} or higher` };
    if (isdef(max) && x > max) return { error: `Must be ${max} or less` };
    return true;
  }
};

const bool = {
  name: "Bool",
  sql_name: "boolean",
  editAs: (nm, v, cls) =>
    `<input class="form-check-input ${cls ||
      ""}" type="checkbox" name="${nm}" id="input${nm}" ${v ? `checked` : ""}>`,
  attributes: [],
  readFromFormRecord: (rec, name) => {
    return rec[name] ? true : false;
  },
  read: v => {
    switch (typeof v) {
      case "string":
        if (v.toUpperCase === "TRUE" || v.toUpperCase === "T") return true;
        else return false;
      default:
        return v ? true : false;
    }
  },
  validate: () => x => true
};

const types = [string, int, bool];

const mkTyDict = tys => {
  var d = {};
  tys.forEach(t => {
    d[t.name] = t;
  });
  return d;
};

types.as_dict = mkTyDict(types);

types.names = types.map(t => t.name);

module.exports = types;
