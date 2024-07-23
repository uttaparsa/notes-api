export function copyTextInsideElementToClipboard(element) {
    const range = document.createRange();
    range.selectNode(element);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
   window.dispatchEvent(new CustomEvent('showToast', {
      detail: {
        title: "Copy",
        body: "Text copied",
        delay: 3000,
        variant: "success",
      }
    }));
  }
  
  export function copyTextToClipboard(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    copyTextAreaContentsToClipboard(textarea);
    document.body.removeChild(textarea);
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: {
        title: "Copy",
        body: "Text copied",
        delay: 3000,
        variant: "success",
      }
    }));
  }

  export function copyTextAreaContentsToClipboard(textarea) {
    textarea.select();
    document.execCommand("copy");
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: {
        title: "Copy",
        body: "Text copied",
        delay: 3000,
        variant: "success",
      }
    }));
  }