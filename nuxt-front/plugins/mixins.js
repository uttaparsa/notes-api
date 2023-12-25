import Vue from "vue";
import moment from 'moment';



function ErrorResponseHandler(color) {
  this.msg500 = "مشکلی سمت سرور پیش آمد، لطفا چند لحظه دیگر تلاش کنید.";
  this.mgs400 = `یکی از فیلد‌های ورودی صحیح نیست`;
}

(ErrorResponseHandler.prototype.handle = function (err, main_vue) {
  if (err.response) {
    console.log(err.response);
    if (err.response.status == 429) {
      main_vue.$bvToast.toast(
        `امکان استفاده مجدد نمی‌باشد، لطفا ${err.response.data.timeout_in_seconds} ثانیه دیگر مجدد تلاش کنید`,
        {
          title: "خطا",
          autoHideDelay: 5000,
          variant: "danger",
          toaster: "b-toaster-top-left",
        }
      );
    } else if (err.response.status == 400) {
      if (
        err.response.data &&
        err.response.data.errors &&
        err.response.data.errors[0] &&
        err.response.data.errors[0].length > 0
      ) {
        this.mgs400 = err.response.data.errors[0];
      }
      main_vue.$bvToast.toast(this.mgs400, {
        title: "خطا",
        autoHideDelay: 5000,
        variant: "danger",
        toaster: "b-toaster-top-left",
      });
    } else if (err.response.status == 402) {
      main_vue.$bvToast.toast(`موجودی حساب شما کافی نمی‌باشد.`, {
        title: "خطا",
        autoHideDelay: 5000,
        variant: "danger",
        toaster: "b-toaster-top-left",
      });
    } else if (err.response.status == 404) {
      main_vue.$bvToast.toast(`api مورد نظر یافت نشد`, {
        title: "خطا",
        autoHideDelay: 5000,
        variant: "danger",
        toaster: "b-toaster-top-left",
      });
    } else if (err.response.status >= 500) {
      if (
        err.response &&
        err.response.data &&
        err.response.data.data &&
        err.response.data.data.length > 0
      ) {
        this.msg500 = err.response.data.data;
      }
      main_vue.$bvToast.toast(this.msg500, {
        title: "خطا",
        autoHideDelay: 5000,
        variant: "danger",
        toaster: "b-toaster-top-left",
      });
    }
  } else if (err.request) {
    console.log(err.request);
    main_vue.$bvToast.toast("خطای اتصال به سرور", {
      title: "خطا",
      autoHideDelay: 5000,
      variant: "danger",
      toaster: "b-toaster-top-left",
    });
  } else {
    // Some other errors
    console.log("Error", err.message);
    console.log( err.stack);
    main_vue.$bvToast.toast("خطای نامشخص", {
      title: "خطا",
      autoHideDelay: 5000,
      variant: "danger",
      toaster: "b-toaster-top-left",
    });
  }
}),
  (window.ResponseHandler = ErrorResponseHandler);
const rtl_rx = /[\u0600-\u06FF]/
const mixin = {
  methods: {
    isRTL(text){
      return rtl_rx.test(text) 
    },
    formatDate(strDate){
      return moment(String(strDate)).format('MM/DD/YYYY HH:mm')
    },
    toFarsiNumber(n) {
      const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

      return n
        .toString()
        .split("")
        .map((x) => farsiDigits[x])
        .join("");
    },

    getCleanedPhoneNumber(phoneNumber) {
      return "+98" + phoneNumber.substr(phoneNumber.length - 10);
    },
    makeToast: function ({
      text,
      title = "خطا",
      variant = "info",
      append = false,
      place = "b-toaster-top-left",
    } = {}) {
      this.$bvToast.toast(text, {
        title: title,
        autoHideDelay: 5000,
        variant: variant,
        appendToast: append,
        toaster: place,
      });
    },
    storageURL(url) {
      const pathname = new URL("http://" + url).pathname;
      let completeURL = "https://panel.iavasho.ir/storage" + pathname;
      return completeURL;
    },
    copyElementTextToClipboard(element) {
      var range = document.createRange();
      range.selectNode(element);
      window.getSelection().removeAllRanges(); // clear current selection
      window.getSelection().addRange(range); // to select text
      document.execCommand("copy");
      window.getSelection().removeAllRanges(); // to deselect
      this.makeToast({ text: "متن کپی شد", title: "کپی" });
    },
    copyTextAreaContentsToClipboard(textarea) {
      textarea.select();
      document.execCommand("copy");
      this.makeToast({ text: "متن کپی شد", title: "کپی" });
    },
    updateTextAreaHeight(textarea) {
      textarea.style.height = "1px";
      textarea.style.height =
        25 + textarea.scrollHeight + "px";
    },
    linkify(text){
      return text.replace(/(?:(https?\:\/\/[^\s]+))/g, '<a href="$1">$1</a>')
    }
  },
};

Vue.mixin(mixin);
