/**
 * IDE registry（当前只考虑 Cursor/VS Code，但结构留好了）
 * 未来加 IDE：只需要在这里加一项 + 在 UI 列表里补一项即可。
 */
export const IDE_REGISTRY = {
    cursor: { id: 'cursor', name: 'Cursor', command: 'cursor', markers: ['.cursor'] },
    vscode: { id: 'vscode', name: 'VS Code', command: 'code', markers: ['.vscode'] }
};
// UI/遍历使用：固定顺序列表（避免 Object.values 的顺序语义）
export const IDE_LIST = [IDE_REGISTRY.cursor, IDE_REGISTRY.vscode];
export const DEFAULT_IDE_ID = 'cursor';
/**
 * marker -> ideId 映射（模块加载时构建一次，检测阶段直接查表）
 */
export const IDE_MARKER_TO_ID = new Map(IDE_LIST.flatMap((ide) => ide.markers.map((m) => [m, ide.id])));
export function getIdeById(id) {
    if (!id)
        return undefined;
    if (id === 'cursor')
        return IDE_REGISTRY.cursor;
    if (id === 'vscode')
        return IDE_REGISTRY.vscode;
    return undefined;
}
