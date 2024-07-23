const rtl_rx = /[\u0600-\u06FF]/;

export function isRTL(text) {
  return rtl_rx.test(text);
}

export function toFarsiNumber(n) {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().split("").map(x => farsiDigits[x]).join("");
}

export function linkify(text) {
  return text.replace(/(?:(https?\:\/\/[^\s]+))/g, '<a href="$1">$1</a>');
}