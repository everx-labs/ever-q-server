import { configParams } from "../../server/config";
import {
    ConfigParam,
} from "../../server/config-param";
import { formatTable } from "../../server/utils";

const rows = [["Option", "ENV", "Default", "Description"]];
for (const param of ConfigParam.getAll(configParams)) {
    rows.push([
        `${param.option}${param.deprecated ? " (DEPRECATED)" : ""}`,
        param.env,
        `${param.defaultValueAsString()}`,
        param.description,
    ]);
}

console.log(formatTable(rows, {
    headerSeparator: true,
    multilineIndent: "",
}));
