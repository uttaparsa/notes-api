export function copyTextInsideElementToClipboard(element) {
    const range = document.createRange();
    range.selectNode(element);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
  }
  
  export function copyTextToClipboard(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    copyTextAreaContentsToClipboard(textarea);
    document.body.removeChild(textarea);

  }

  export function copyTextAreaContentsToClipboard(textarea) {
    textarea.select();
    document.execCommand("copy");

  }