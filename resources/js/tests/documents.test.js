import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rebuildIframeDocuments } from '../lib/documents.js';

class Mirror {
    ids = new Map();

    add(node, id) {
        this.ids.set(node, id);
    }

    getId(node) {
        return this.ids.get(node) ?? -1;
    }

    has(id) {
        return [...this.ids.values()].includes(id);
    }

    removeNodeFromMap(node) {
        this.ids.delete(node);
    }
}

/** rrweb's attachDocumentToIframe, as far as this goes: a document already in the mirror keeps its old tree. */
function replayer() {
    return {
        mirror: new Mirror(),
        virtualDom: { mirror: new Mirror() },
        usingVirtualDom: false,
        attachDocumentToIframe(mutation, iframe) {
            const mirror = this.usingVirtualDom ? this.virtualDom.mirror : this.mirror;

            if (mirror.has(mutation.node.id)) return;

            iframe.contentDocument.body = mutation.node.body;
            mirror.add(iframe.contentDocument, mutation.node.id);
        },
    };
}

const write = (body) => ({ parentId: 7, node: { id: 30, type: 0, body } });

test('every document written into an iframe replaces the one before, not only the first', () => {
    const subject = replayer();
    const iframe = { contentDocument: { body: '' } };

    rebuildIframeDocuments(subject);

    subject.attachDocumentToIframe(write('Total ₦0.00'), iframe);
    subject.attachDocumentToIframe(write('Total ₦977,500.00'), iframe);

    assert.equal(iframe.contentDocument.body, 'Total ₦977,500.00');
});

test('seeking rebuilds the virtual DOM the same way', () => {
    const subject = replayer();
    const iframe = { contentDocument: { body: '' } };

    rebuildIframeDocuments(subject);
    subject.usingVirtualDom = true;

    subject.attachDocumentToIframe(write('first'), iframe);
    subject.attachDocumentToIframe(write('second'), iframe);

    assert.equal(iframe.contentDocument.body, 'second');
    assert.equal(subject.mirror.getId(iframe.contentDocument), -1);
});

test('a different document in the iframe stays in the mirror, and stopping restores rrweb', () => {
    const subject = replayer();
    const iframe = { contentDocument: { body: 'old' } };
    const original = subject.attachDocumentToIframe;

    subject.mirror.add(iframe.contentDocument, 99);

    const stop = rebuildIframeDocuments(subject);

    subject.attachDocumentToIframe(write('new'), iframe);
    assert.equal(subject.mirror.getId(iframe.contentDocument), 30);

    stop();
    assert.equal(subject.attachDocumentToIframe, original);
});
