/**
 * An element handler responds to any incoming element, when attached using the .on function of an HTMLRewriter instance
 * This is a scoped selector class that required a particular selector/element to be used.
 */
export class ElementHandler {

    constructor(variant) {
        this.variant = variant;
    }

    element(element) {
        if (element.tagName === 'title') {
            element.setInnerContent(this.variant.title);
        }
        if (element.tagName === 'h1') {
            element.setInnerContent(this.variant.h1);
        }
        if (element.tagName === 'p') {
            element.setInnerContent(this.variant.description);
        }
        if (element.tagName === 'a') {
            element.setAttribute("href", this.variant.urlLink);
            element.setInnerContent(this.variant.urlTitle);
        }
    }
}