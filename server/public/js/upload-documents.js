$(document).ready(function () {
  let count = 0;

  $('.upload-documents').on('click', function (e) {
    e.preventDefault();

    const button = this;
    const ul = $('.ul-documents');
    const url = $(button).attr('data-url');

    $(button).attr('disabled', true);

    count += 10;

    $.ajax({
      url: url,
      type: 'POST',
      data: `count=${count}`,
      statusCode: {
        200: res => {
          let li;

          switch (url) {
            case '/building/upload':
              for (let i = 0; i < res.addresses.length; i++) {
                let address = res.addresses[i];
                li = `<li data-id="${address._id}" data-url="/building/edit" data-url-delete="/building/delete" data-place="${address.place}" data-x="${address.cords[0]}" data-y="${address.cords[1]}"><div class="title">${address.title}</div><div class="cranes" data-marks="${address.cranes.marks.join(', ')}" data-series="${address.cranes.series.join(', ')}">${address.cranes.marks.length} ${num2str(address.cranes.marks.length, ['кран', 'крана', 'кранов'])}</div><ul class="contol"><li class="edit_document"><a href="#" uk-toggle="target: #edit-loc">Изменить</a></li><li class="delete_document"><a href="#">Удалить</a></li></ul></li>`;
                ul.append(li);
              }
              $.getScript("js/manage-documents.js");
              break;

            case '/news/upload':
              for (let i = 0; i < res.news.length; i++) {
                let news = res.news[i];
                li = `<li data-id="${news._id}" data-url="/news/edit" data-url-delete="/news/delete"><div class="title">${news.title}</div><div class="date">${formatDate(new Date(news.date))}</div><ul class="contol"><li class="edit_document" uk-toggle="target: #add-news"><a href="#">Изменить</a></li><li class="delete_document"><a href="#">Удалить</a></li></ul></li>`;
                ul.append(li);
              }
              $.getScript("js/manage-documents.js");
              break;

            case '/workers/upload_w':
              for (let i = 0; i < res.workers.length; i++) {
                let worker= res.workers[i];
                li = `<li data-id="${worker._id}" data-url="/workers/edit" data-url-delete="/workers/delete" data-login="${worker.login}"><div class="title">${worker.username}</div><ul class="contol"><li class="edit_document"><a href="#" uk-toggle="target: #edit-user">Изменить</a></li><li class="delete_document"><a href="#">Удалить</a></li></ul></li>`;
                ul.append(li);
              }
              $.getScript("js/manage-documents.js");
              break;

            case '/upload-tables':
              for (let i = 0; i < res.tables.length; i++) {
                li = `<li><div class="date-nums">${formatDateForTables(res.tables[i].date)}</div><div class="clean"></div><div class="status"></div><ul class="contol"><li><a href="#">Изменить</a></li><li><a href="#">В архив</a></li></ul></li>`;
                ul.append(li);
              }
              $.getScript("js/manage-documents.js");
              break;
          }

          if (res.total_elements)
            $(button).remove();

          $(button).attr('disabled', false);
        }
      }
    });

    return false;
  });
});

function formatDateForTables(date) {
  let monthNames = [
    "Январь", "Февраль", "Март",
    "Апрель", "Май", "Июнь", "Июль",
    "Август", "Сентябрь", "Октябрь",
    "Ноябрь", "Декабрь"
  ];
        
  let day = new Date(date).getDate();
  let monthIndex = new Date(date).getMonth();

  day = day < 10 ? '0' + day : day;
      
  return `<div class="number">${day}</div><div class="month">${monthNames[monthIndex]}</div>`;
}

function formatDate(date) {
  let monthNames = [
    "Январь", "Февраль", "Март",
    "Апрель", "Май", "Июнь", "Июль",
    "Август", "Сентябрь", "Октябрь",
    "Ноябрь", "Декабрь"
  ];

  let day = date.getDate();
  let monthIndex = date.getMonth();
  let year = date.getFullYear();

  return day + ' ' + monthNames[monthIndex] + ' ' + year;
}
