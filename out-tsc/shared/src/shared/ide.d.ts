export type IDEId = 'cursor' | 'vscode';
export interface IDEInfo {
    id: IDEId;
    name: string;
    command: string;
    /**
     * 用于“自动匹配默认编辑器”的目录标记（文件/目录名）
     * 例如：.cursor / .vscode
     */
    markers: string[];
}
/**
 * IDE registry（当前只考虑 Cursor/VS Code，但结构留好了）
 * 未来加 IDE：只需要在这里加一项 + 在 UI 列表里补一项即可。
 */
export declare const IDE_REGISTRY: {
    readonly cursor: {
        readonly id: "cursor";
        readonly name: "Cursor";
        readonly command: "cursor";
        readonly markers: [".cursor"];
    };
    readonly vscode: {
        readonly id: "vscode";
        readonly name: "VS Code";
        readonly command: "code";
        readonly markers: [".vscode"];
    };
};
export declare const IDE_LIST: readonly IDEInfo[];
export declare const DEFAULT_IDE_ID: IDEId;
/**
 * marker -> ideId 映射（模块加载时构建一次，检测阶段直接查表）
 */
export declare const IDE_MARKER_TO_ID: Map<string, IDEId>;
export declare function getIdeById(id: string | undefined | null): IDEInfo | undefined;
