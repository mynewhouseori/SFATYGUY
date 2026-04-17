const enterButton = document.getElementById("enterButton");

if (enterButton) {
  enterButton.addEventListener("click", () => {
    enterButton.classList.add("is-pressed");

    window.setTimeout(() => {
      enterButton.classList.remove("is-pressed");
    }, 180);
  });
}
