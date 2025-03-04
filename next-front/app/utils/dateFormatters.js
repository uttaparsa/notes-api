import moment from 'moment';

export function formatDate(strDate) {
  return moment(String(strDate)).format('YYYY-MM-DD HH:mm');
}

export function formatDateLarge(strDate) {
    return moment(String(strDate)).format('ddd YYYY-MM-DD HH:mm');
  }
  
  export function formatDateSmall(strDate) {
    return moment(String(strDate)).format('YYYY-MM-DD HH:mm');
  }


  export function formatDateLikeHuman(strDate) {
    return moment(String(strDate)).format('YYYY-MM-DD HH:mm');
  }

  export function formatDateShort(strDate) {
    return moment(String(strDate)).format('ddd MMM D');
  }