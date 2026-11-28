/**
 * A page that writes a new document into an iframe (document.open(), write(), close(), as an editor's live preview
 * does) is recorded as the same document node added again with new children. rrweb's replayer finds that document
 * id already in its mirror and keeps the old tree, so the replay shows the iframe's first document forever. Taking
 * the document out of the mirror first makes rrweb clear it and build the new one, on the page and while seeking
 * (the virtual DOM). Returns what stops it, or null for a replayer without the hook.
 */
export function rebuildIframeDocuments(replayer) {
    if (typeof replayer?.attachDocumentToIframe !== 'function') return null;

    const attach = replayer.attachDocumentToIframe;

    replayer.attachDocumentToIframe = function (mutation, iframe) {
        const mirror = this.usingVirtualDom ? this.virtualDom?.mirror : this.mirror;
        const document = iframe?.contentDocument;

        if (mirror && document && mirror.getId(document) === mutation?.node?.id) mirror.removeNodeFromMap(document);

        return attach.call(this, mutation, iframe);
    };

    return () => {
        replayer.attachDocumentToIframe = attach;
    };
}
