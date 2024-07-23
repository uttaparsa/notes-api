import moment from 'moment';

export function formatDate(strDate) {
  return moment(String(strDate)).format('MM/DD/YYYY HH:mm');
}

export function formatDateLarge(strDate) {
    return moment(String(strDate)).format('ddd MM/DD/YYYY HH:mm');
  }
  
  export function formatDateSmall(strDate) {
    return moment(String(strDate)).format('MM/DD/YYYY HH:mm');
  }