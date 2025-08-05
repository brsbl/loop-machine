export function safeQuerySelector(selector, parent = document, required = false) {
  const element = parent.querySelector(selector);
  
  if (!element && required) {
    console.error(`Required element not found: ${selector}`);
    throw new Error(`Required DOM element not found: ${selector}`);
  }
  
  if (!element) {
    console.warn(`Element not found: ${selector}`);
  }
  
  return element;
}

export function safeGetElementById(id, required = false) {
  const element = document.getElementById(id);
  
  if (!element && required) {
    console.error(`Required element not found with ID: ${id}`);
    throw new Error(`Required DOM element not found with ID: ${id}`);
  }
  
  if (!element) {
    console.warn(`Element not found with ID: ${id}`);
  }
  
  return element;
}

export function safeQuerySelectorAll(selector, parent = document) {
  const elements = parent.querySelectorAll(selector);
  
  if (elements.length === 0) {
    console.warn(`No elements found for selector: ${selector}`);
  }
  
  return elements;
}

export function safeAddEventListener(element, event, handler, options) {
  if (!element) {
    console.warn(`Cannot add event listener to null element`);
    return false;
  }
  
  element.addEventListener(event, handler, options);
  return true;
}

export function safeSetAttribute(element, attribute, value) {
  if (!element) {
    console.warn(`Cannot set attribute on null element`);
    return false;
  }
  
  element.setAttribute(attribute, value);
  return true;
}

export function safeSetTextContent(element, text) {
  if (!element) {
    console.warn(`Cannot set text content on null element`);
    return false;
  }
  
  element.textContent = text;
  return true;
}

export function safeClassListAdd(element, ...classes) {
  if (!element) {
    console.warn(`Cannot add classes to null element`);
    return false;
  }
  
  element.classList.add(...classes);
  return true;
}

export function safeClassListRemove(element, ...classes) {
  if (!element) {
    console.warn(`Cannot remove classes from null element`);
    return false;
  }
  
  element.classList.remove(...classes);
  return true;
}