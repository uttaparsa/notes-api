import Vue from 'vue'
import moment from 'moment';

Vue.filter('toFarsiNumber', function (n) {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  return n
    .toString()
    .split('')
    .map(x => farsiDigits[x])
    .join('');
})

Vue.filter('zeroPad', function (n,places) {
  
  return String(n).padStart(places, '0')
})

Vue.filter('linkify',function(text){
  return text.replace(/(?:(https?\:\/\/[^\s]+))/g, '<a href="$1">$1</a>')
})

Vue.filter('formatDateLarge', function (strDate) {
  
  return moment(String(strDate)).format('ddd MM/DD/YYYY HH:mm')

})


Vue.filter('formatDateSmall', function (strDate) {
  
  return moment(String(strDate)).format('MM/DD/YYYY HH:mm')

})