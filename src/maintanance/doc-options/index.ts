import { programOptions } from "../../server/config";

const captions = ["Option", "ENV", "Default", "Description"];
const widths = [0, 0, 0, 0];
const rows: string[][] = Object.values(programOptions).map(x => [x.option, x.env, x.def, x.description]);

const MAX_WIDTH = 80;

function adjustWidths(row: string[]) {
    for (let i = 0; i < row.length; i += 1) {
        const width = breakWords(row[i], MAX_WIDTH).reduce((w, s) => Math.max(w, s.length), 0);
        if (width > widths[i]) {
            widths[i] = width;
        }
    }
}

function breakWords(s: string, width: number): string[] {
    const words = s.split(" ");
    const result = [];
    let line = "";
    words.forEach((w) => {
        if (line.length + w.length > width) {
            result.push(line);
            line = "";
        }
        if (line !== "") {
            line += " ";
        }
        line += w;
    });
    if (line !== "") {
        result.push(line);
    }
    return result;
}

function printLine(columns: string[][], row: number): boolean {
    const line = columns
        .map(x => row < x.length ? x[row] : "")
        .map((x, i) => x.padEnd(widths[i]))
        .join("  ");
    if (line.trim().length === 0) {
        return false;
    }
    console.log(line.trim());
    return true;
}

function printRow(row: string[]) {
    const columns: string[][] = row.map((x, i) => breakWords(x, widths[i]));
    let i = 0;
    while (printLine(columns, i)) {
        i += 1;
    }
}

adjustWidths(captions);
rows.forEach(adjustWidths);

printRow(captions);
printRow(widths.map(x => "-".repeat(x)));
rows.forEach((row) => {
    printRow(row);
});

