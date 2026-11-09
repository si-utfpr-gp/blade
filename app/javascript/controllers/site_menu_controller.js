import { Controller } from "@hotwired/stimulus"

// Closes the public pages' mobile menu once a link in it is followed. The
// menu is a <details> and works without this; here it only stops a section
// link from leaving the menu open over the page it scrolled to.
export default class extends Controller {
  close() {
    this.element.open = false
  }
}
