$(document).ready(function() {
  $('.search').on('submit', function(e) {
    e.preventDefault();

    const ul = $('.ul-documents');
    const searchString = $('#searchString').val();
    const data = $(this).serialize();
    const url = $(this).attr('action');
    const type = $(this).attr('method');
    let li, upload_url;

    $.ajax({
      url: url,
      type: type,
      data: data,
      statusCode: {
        200: res => {
          ul.empty();

          switch (url) {
            case '/workers/search':
              let workers = res.workers;
              upload_url = '/workers/upload_w';
              for (let i = 0; i < workers.length; i++)
                ul.append(`<li data-id="${workers[i]._id}" data-url="/workers/edit" data-url-delete="/workers/delete" data-login="${workers[i].login}"><div class="title">${workers[i].username}</div><ul class="contol"><li class="edit_document"><a href="#" uk-toggle="target: #edit-user">Изменить</a></li><li class="delete_document"><a href="#">Удалить</a></li></ul></li>`);
              break;

            case '/building/search':
              let addresses = res.addresses;
              upload_url = '/building/upload';
              for (let i = 0; i < addresses.length; i++)
                ul.append(`<li data-id="${addresses[i]._id}" data-url="/building/edit" data-url-delete="/building/delete" data-place="${addresses[i].place}" data-x="${addresses[i].cords[0]}" data-y="${addresses[i].cords[1]}"><div class="title">${addresses[i].title}</div><div class="cranes" data-marks="${addresses[i].cranes.marks.join(', ')}" data-series="${addresses[i].cranes.series.join(', ')}">${addresses[i].cranes.marks.length + ' ' + num2str(addresses[i].cranes.marks.length, ['кран', 'крана', 'кранов'])}</div><ul class="contol"><li class="edit_document"><a href="#" uk-toggle="target: #edit-loc">Изменить</a></li><li class="delete_document"><a href="">Удалить</a></li></ul></li>`);
              break;
          }

          $('.upload-documents').remove();
          
          if (res.total) {
            $('.d_content .ul-documents').css({'min-height': '615px'});
            $('.d_content').append(`<button class="uk-button uk-button-primary upload-documents" data-url="${upload_url}">Загрузить ещё...</button>`);
          }

          $.getScript("js/upload-documents.js");
          $.getScript("js/manage-documents.js");
        }
      }
    });
  });
  
});