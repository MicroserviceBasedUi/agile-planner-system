import * as moment from 'moment';

export class DateFormatValueConverter {
   toView(value) {
      return moment(new Date(Date.parse(value))).format('YYYY-M-D');
   }
}
