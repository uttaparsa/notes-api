export function copyElementTextToClipboard(element, toast) {
    const range = document.createRange();
    range.selectNode(element);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    toast({
      title: "Copy",
      description: "Text copied",
      status: "success",
    });
  }
  
  export function copyTextAreaContentsToClipboard(textarea, toast) {
    textarea.select();
    document.execCommand("copy");
    toast({
      title: "Copy",
      description: "Text copied",
      status: "success",
    });
  }