$(document).ready(function () {
  let worked = [];
  let lunched = [];
  let clearTime = [];

  $('.change-table-address').on('change', function () {
    const address = this.value;
    const worker = $(this).attr('data-worker'); 
    const date = $(this).attr('data-date'); 

    $.ajax({
      url: `/tables?date=${date}&worker=${worker}&address=${address}`,
      method: 'GET',
      statusCode: {
        200: ({ tablesForAddress, cranes }) => {
          $('.itl').remove();

          let newLine = '';
          let newOption = '';

          worked = [];
          lunched = [];
          clearTime = [];

          $('.change-table-crane').empty();

          for (let i = 0; i < cranes.length; i++) {
            newOption = `<option value="${cranes[i]}">${cranes[i]}</option>`;
            $('.change-table-crane').append(newOption);
          }

          for (let i = 0; i < tablesForAddress.length; i++) { 
            newLine = `<div class="info-table-line itl" data-date="${tablesForAddress[i].day}"><div class="info-table-item num">${tablesForAddress[i].day < 10 ? '0' + tablesForAddress[i].day : tablesForAddress[i].day}</div><div class="info-table-item"><input class="uk-input" type="text" placeholder="" name="coming" value="${tablesForAddress[i].coming}"/></div><div class="info-table-item"><input class="uk-input" type="text" placeholder="" name="leaving" value="${tablesForAddress[i].leaving}"/></div><div class="info-table-item"><input class="uk-input worked" type="text" placeholder="" value="${getFullTime(tablesForAddress[i].coming, tablesForAddress[i].leaving)}" disabled/></div><div class="info-table-item"><input class="uk-input" type="text" placeholder="" name="lunch" value="${addTimeToLunchArray(tablesForAddress[i].lunch)}"/></div><div class="info-table-item"><input class="uk-input clearTime" type="text" placeholder="" value="${getFullTimeWithoutLunch(tablesForAddress[i].coming, tablesForAddress[i].leaving, tablesForAddress[i].lunch)}" disabled/></div><div class="info-table-item"><input class="uk-input username" type="text" placeholder="" value="${tablesForAddress[i].username}" disabled/></div></div>`
          
            $('.info-table').append(newLine);
          }

          $('#worked').val(sumOfTimes(worked));
          $('#lunched').val(sumOfTimes(lunched));
          $('#clearTime').val(sumOfTimes(clearTime));
        }
      }
    })
  });

  $('.save').on('click', function() {
    const date = $(this).attr('data-date');
    const login = $(this).attr('data-worker');
    const address = $('.change-table-address').val();
    const itl = $('.itl');
    const data = {
      date: date,
      address: address,
      login: login,
      staticData: []
    };
    
    $.each(itl, function (indexInArray, valueOfElement) { 
      const dayOfMonth = $(this).attr('data-date');
      const coming = $('input[name="coming"]', $(this)).val();
      const leaving = $('input[name="leaving"]', $(this)).val();
      const lunch = $('input[name="lunch"]', $(this)).val();
      const response = {};

      response.day = dayOfMonth;
      response.coming = coming;
      response.leaving = leaving;
      response.lunch = lunch;

      data.staticData.push(response); 
    });

    $.ajax({
      method: 'POST',
      url: '/tables/change',
      data: data,
      statusCode: {
        200: () => window.location.reload()
      }
    });
  });

  function getFullTime(firstDate, secondDate, flag) {
    let getDate = (string) => new Date(0, 0, 0, string.split(':')[0], string.split(':')[1]);
    let different = (getDate(secondDate) - getDate(firstDate));
    let differentRes, hours, minuts;
    
    if(different > 0) {
      differentRes = different;
      hours = Math.floor((differentRes % 86400000) / 3600000);
      minuts = Math.round(((differentRes % 86400000) % 3600000) / 60000);
    } else {
      differentRes = Math.abs((getDate(firstDate) - getDate(secondDate)));
      hours = Math.floor(24 - (differentRes % 86400000) / 3600000);
      minuts = Math.round(60 - ((differentRes % 86400000) % 3600000) / 60000);
    }
  
    let result = (hours < 10 ? '0' + hours : hours) + ':' + (minuts < 10 ? '0' + minuts : minuts);
  
    if (!flag)
      worked.push(result);
    
    return result;
  }
  
  function addTimeToLunchArray(lunchTime) {
    lunched.push(lunchTime);
    return lunchTime;
  }
  
  function getFullTimeWithoutLunch(firstDate, secondDate, lunchDate) {
    let newSecondTime = getFullTime(lunchDate, secondDate, true);
    let result = getFullTime(firstDate, newSecondTime, true);
  
    clearTime.push(result);
  
    return result;
  }
  
  function sumOfTimes(arrayOfTimes) { 
    let result = arrayOfTimes.reduce((time1, time2) => {
      let hour = 0;
      let minute = 0;
  
      let splitTime1 = time1.split(':');
      let splitTime2 = time2.split(':');
  
      hour = parseInt(splitTime1[0]) + parseInt(splitTime2[0]);
      minute = parseInt(splitTime1[1]) + parseInt(splitTime2[1]);
      hour = minute >= 60 ? hour + 1 : hour;
      minute = minute > 60 ? minute - 60 : hour == 60 ? 0 : minute;
      
      let response = (hour < 10 ? '0' + hour : hour) + ':' + (minute < 10 ? '0' + minute : minute);
  
      return response;
    });
    
    return result;
  }
});