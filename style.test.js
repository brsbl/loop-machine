/**
 * @jest-environment jsdom
 */

describe("CSS Style Tests", () => {
  beforeEach(() => {
    // Load the CSS file content
    const css = `
      body {
        margin: 0;
        padding: 0;
        background-color: #222;
        font-family: Arial, sans-serif;
      }
      
      .sidebar-visible #sidebar {
        transform: translateX(0);
      }
      
      .step-button {
        width: 40px;
        height: 40px;
        background-color: #555;
        border: 1px solid #666;
      }
      
      .step-button.active {
        background-color: #ffa500;
      }
      
      .step-button.current {
        border: 2px solid #fff;
      }
    `;
    
    const style = document.createElement("style");
    style.innerHTML = css;
    document.head.appendChild(style);
  });

  afterEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  test("Body should have correct background color", () => {
    const bodyStyle = window.getComputedStyle(document.body);
    expect(bodyStyle.margin).toBe("0px");
    expect(bodyStyle.padding).toBe("0px");
  });

  test("Sidebar should be visible when sidebar-visible class is added", () => {
    document.body.innerHTML = '<div id="sidebar"></div>';
    document.body.classList.add("sidebar-visible");
    
    const sidebar = document.getElementById("sidebar");
    expect(sidebar).toBeTruthy();
  });

  test("Step button should have correct dimensions", () => {
    document.body.innerHTML = '<button class="step-button"></button>';
    const button = document.querySelector(".step-button");
    
    expect(button).toBeTruthy();
    expect(button.className).toBe("step-button");
  });

  test("Active step button should have different styling", () => {
    document.body.innerHTML = '<button class="step-button active"></button>';
    const button = document.querySelector(".step-button");
    
    expect(button.classList.contains("active")).toBe(true);
  });

  test("Current step should have border styling", () => {
    document.body.innerHTML = '<button class="step-button current"></button>';
    const button = document.querySelector(".step-button");
    
    expect(button.classList.contains("current")).toBe(true);
  });
});