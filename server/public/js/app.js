let toolbar, username, id;
let quills = {};
let editors = ['#editor', '#safety-editor'];
let options = {
  modules: {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike', 'link'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean', 'image']
    ]
  },
  theme: 'snow'
};

let socket = io.connect('http://localhost:3000');

$(document).ready(function () {
  id = $('main').attr('data-id');
  username = $('main').attr('data-username');
  checkEditors(editors, true, true);
  
  if (id !== '')
    socket.emit('auth', id, isUser => !isUser ?  window.location.href = '/login' : socket.emit('join:room', true, 'public'));
  
  $('form.modal').on('submit', function(e) {
    e.preventDefault();
  
    const form = this; 
    const url = $(form).attr('action');
    const method = $(form).attr('method');
    const data = url == '/news/add' || url == '/news/edit' ? `id=${$('input[name="id"]', form).val()}&title=${$('input[name="title"]', form).val()}&content=${$('#editor .ql-editor').html()}` : url == '/safety/edit' ? `content=${$('#safety-editor .ql-editor').html()}` : $(form).serialize();
    
    $.ajax({
      url: url,
      type: method,
      data: data,
      statusCode: {
        200: res => {
          let li, total_count;
          $('.error').html('');

          switch(url) {
            case '/login/admin':
              window.location.href = "/news";
              break;
            
            case '/workers/add':
              li = `<li data-id=${res.id} data-login=${res.login} data-url="/workers/edit" data-url-delete="/workers/delete"><div class="title">${res.username}</div><ul class="contol"><li class="edit_document"><a href="#" uk-toggle="target: #edit-user">Изменить</a></li><li class="delete_document"><a href="#">Удалить</a></li></ul></li>`;
    
              $('input').val('');
              $('.ul-documents.worker').append(li);

              $.getScript("js/manage-documents.js");
    
              $('.success').text(`Работник ${res.username} успешно добавлен!`);
              setTimeout(() => $('.success').text(''), 3000);
              break;

            case '/workers/edit':
              const workers_li = $(`li[data-id="${res.id}"]`);
              const title = workers_li.find('.title');
              const fullname = res.username;
              
              $(title).text(fullname);
              workers_li.attr('data-login', res.login);
              $('input[name="password"]').val('');
    
              $('.success').text(`Параметры работника ${fullname} успешно изменены`);
              setTimeout(() => $('.success').text(''), 3000);
              break;
            
            case '/building/add':
              total_count = res.total_count;

              const address = res.address;
              const place = res.place;
              const added_address = $('.ul-documents.building li');

              if ((place == address.place) && (added_address.length > total_count)) {
                li = `<li data-id="${address._id}" data-url="/building/edit" data-url-delete="/building/delete" data-place="${address.place}" data-x="${address.cords[0]}" data-y="${address.cords[1]}"><div class="title">${address.title}</div><div class="cranes" data-marks="${address.cranes.marks.join(', ')}" data-series="${address.cranes.series.join(', ')}">${address.cranes.marks.length} ${num2str(address.cranes.marks.length, ['кран', 'крана', 'кранов'])}</div><ul class="contol"><li class="edit_document"><a href="#" uk-toggle="target: #edit-loc">Изменить</a></li><li class="delete_document"><a href="#">Удалить</a></li></ul></li>`;
                $('.ul-documents.building').append(li);
              }

              $('input').val('');
              $.getScript("js/manage-documents.js");

              $('.success').text('Добавлен новый адрес стройки');
              setTimeout(() => $('.success').text(''), 3000);
              break;
            
            case '/building/edit':
              const edited_address = res.addr;
              const edited_li = $(`li[data-id="${edited_address._id}"]`);
              const length = edited_address.cranes.marks.length + ' ' + num2str(edited_address.cranes.marks.length, ['кран', 'крана', 'кранов']);

              if (edited_li.attr('data-place') !== edited_address.place) {
                UIkit.modal('#edit-loc').toggle();
                edited_li.remove();
                return;
              }

              $('.title', edited_li).text(edited_address.title);
              $('.cranes', edited_li).text(length);
              $('.cranes', edited_li).attr('data-marks', edited_address.cranes.marks.join(', '));
              $('.cranes', edited_li).attr('data-series', edited_address.cranes.series.join(', '));

              edited_li.attr('data-x', edited_address.cords[0]);
              edited_li.attr('data-y', edited_address.cords[1]);
              edited_li.attr('data-place', edited_address.place);
              break;

            case '/news/add':
              const news = res.news;

              $('input[name="title"]').val('');
              $('#editor .ql-editor').html('');

              li = `<li data-id="${news._id}" data-url="/news/edit" data-url-delete="/news/delete"><div class="title">${news.title}</div><div class="date">${formatDate(new Date(res.news.date))}></div><ul class="contol"><li class="edit_document" uk-toggle="target: #add-news"><a href="#">Изменить</a></li><li class="delete_document"><a href="#">Удалить</a></li></ul></li>`;

              $('.ul-documents.news').prepend(li);
              $.getScript("js/manage-documents.js");
              break;

            case '/news/edit':
              const edited_news = res.news;
              const news_li = $(`li[data-id="${edited_news._id}"]`);
              
              $('.title', news_li).text(edited_news.title);
              break;

            case '/settings/edit':
              const title_admin = $(`li[data-id="${res.id}"]`).find('.title');
              const adminname = res.username;
                
              $(title_admin).text(adminname);
              $(title_admin).attr('data-login', res.login);
              $('input[name="password"]').val('');
    
              $('.success').text(`Параметры администратора ${adminname} успешно изменены`);
              setTimeout(() => $('.success').text(''), 3000);
              break;

            case '/settings/add':
              li = `<li data-id=${res.id} data-url="/settings/edit" data-url-delete="/settings/delete" data-login=${res.login}><div class="title">${res.username}</div><ul class="contol"><li class="edit_document"><a href="#" uk-toggle="target: #edit-admin">Изменить</a></li><li class="delete_document"><a href="#">Удалить</a></li></ul></li>`;
    
              $('input').val('');
              $('.table-list.settings').append(li);

              $.getScript("js/manage-documents.js");
    
              $('.success').text(`Администратор ${res.username} успешно добавлен!`);
              setTimeout(() => $('.success').text(''), 3000);
              break;

            case '/login/add':
              $('input').val('');
              $('.success').html(`Пароль от комнаты <span style="text-transform: uppercase">${res.room}</span> успешно установлен!`);

              setTimeout(() => $('.success').text(''), 3000);
              break;
          }
        },
        403: jqXHR => {
          console.log(jqXHR);
          const error = JSON.parse(jqXHR.responseText);
          
          $('.success').text('');
          $('.error').text(error.reason);
        }
      }
    });
    
    return false;
  });
  
  $('.admin_nav').on('click', function(e) {
    e.preventDefault();
    
    const a = $(this).find('a');
    const url = $(a).attr('href');
    const title = $(a).attr('data-title');
  
    $($(this).parent()).find('.active').removeClass('active');
    $(this).addClass('active');
  
    document.title = title;
    
    $('main').load(`${url} .d_content`, () => {
      if (url == '/news') {
        checkEditors(editors, true, false);
      } else if (url == '/safety') {
        checkEditors(editors, false, true);
        $.getScript('js/load-safety.js');
        return;
      } else if (url == '/workers' || url == '/building') {
        $.getScript("js/search.js");
      } else if (url == '/map') {
        return $.getScript('js/load-map.js');
      } else if (url == '/archive') {
        return false;
      }
 
      $.getScript("js/manage-documents.js");
      $.getScript("js/upload-documents.js");
    });

    window.history.pushState(url, title, url);
    return false;
  });

  $('.admin_place').on('click', function(e) {
    e.preventDefault();

    const _this = this;
    const place = $(_this).attr('data-place');

    $.ajax({
      url: '/workers/place',
      type: 'POST',
      data: { place: place },
      dataType: 'JSON',
      statusCode: {
        200: () => {
          if (window.location.href.match(/\/(building|map)\/?/)) window.location.reload();

          $('.admin_place').removeClass('active');
          $(_this).addClass('active');
        }
      }
    });
  });
  
  $('.admin_place').on('contextmenu', function(e) {
    e.preventDefault();

    const form = $('form[action="/login/add"]');
    const room = $(this).attr('data-room');

    $('input[name="room"]', form).val(room);
    UIkit.modal('#add-auth').toggle();
  });
});

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

function num2str(n, text_forms) {  
  n = Math.abs(n) % 100; let n1 = n % 10;

  if (n > 10 && n < 20) return text_forms[2];
  if (n1 > 1 && n1 < 5) return text_forms[1];
  if (n1 == 1) return text_forms[0];

  return text_forms[2];
}

let IMAGE_MIME_REGEX = /^image\/(p?jpeg|gif|png)$/i;

function loadImage(file) {
  let reader = new FileReader();

  reader.onload = function(e){
    let img = document.createElement('img');
    img.src = e.target.result;
    let range = window.getSelection().getRangeAt(0);
    range.deleteContents();
    range.insertNode(img);
  };
  reader.readAsDataURL(file);
};

function checkEditors(editors, flag, create) {
  for (let edt of editors) {
    const isNewsEditor = (edt == '#editor' && !flag);

    if (isNewsEditor) continue;
    if ($(edt).length) {
      if (create) quills[edt] = new Quill(edt, options);
      toolbar = quills[edt].getModule('toolbar');
      toolbar.addHandler('image', () => imageHandler(quills[edt]));
    }
  }
}

document.onpaste = function(e){
  let items = e.clipboardData.items;

  if (!items || items.length < 1) return;
  if (IMAGE_MIME_REGEX.test(items[0].type)) {
    loadImage(items[0].getAsFile());
    return;
  }
}

function imageHandler(quill) {
  const Imageinput = document.createElement('input');
  Imageinput.setAttribute('type', 'file');
  Imageinput.setAttribute('accept', 'image/png, image/gif, image/jpeg, image/bmp, image/x-icon');
  Imageinput.classList.add('ql-image');

  Imageinput.addEventListener('change', () =>  {
    const file = Imageinput.files[0];
    const range = quill.getSelection();

    if (Imageinput.files != null && Imageinput.files[0] != null) {
      const fd = new FormData();

      fd.append('file', file);

      $.ajax({ 
        url: '/loadImage/safety', 
        type: 'POST', 
        data: fd, 
        contentType: false, 
        processData: false, 
        statusCode: {
          200: ({ pathImg }) => quill.insertEmbed(range.index, 'image', pathImg, Quill.sources.USER)
        }
      });
    } else {
      console.warn('You could only upload images.');
    }
  });

  Imageinput.click();
}

function sendMessage() {
  let input = $('input', $('#send'));
  let text = input.val();
  let currentUser = $('main').attr('data-username');
  let message = {
    'salt': Math.random() + '',
    'sender': currentUser,
    'text': text,
    'image': false,
    'time': moment().format('LT')
  };

  if (text.trim == '' || !text) return;
  $('.sendinp').prop('disabled', true);

  let div = $('.chat-window');
  let li = `<div class="chat-buble you" data-salt="${message.salt}"><div class="chat-body"><div class="chat-top"><div class="user">${message.sender}</div><div class="time">${message.time}</div><div class="delete-message" data-id="${message.salt}" onclick="deleteMessage('${message.salt}')" uk-icon="icon: close; ratio: 0.8"></div></div><div class="chat-bottom">${message.image ? '<img src="'+message.text+'" style="max-width: 15%" alt="Изображение не загрузилось">' : '<span>'+message.text+'</span>'}</div></div></div>`;

  div.append(li);
  input.val('');

  socket.emit('send:message', 'all', message);

  $(".chat-window").animate({
    scrollTop: $('.chat-window').prop("scrollHeight")
  }, 1000, function () {
    $('.sendinp').prop('disabled', false);
  });
}

function deleteMessage(salt) {
  let message = $(`.delete-message[data-id="${salt}"]`).parent().parent().parent();

  message.remove();
  socket.emit('remove:message', 'all', salt);
}

function uploadMessages() {
  let li;

  $.ajax({
    url: '/archive/upload',
    method: 'POST',
    data: { roomId: 'all' },
    dataType: 'JSON',
    statusCode: {
      200: ({ messages, total }) => {
        const salts = $('.chat-buble').map(function() { return $(this).attr('data-salt') })
        const array = salts.toArray();
        
        for (let i = messages.length - 1; i >= 0; i--) {
          if (array.includes(messages[i].salt)) continue;

          li = `<div class="chat-buble ${messages[i].sender == username ? 'you' : 'he'}" data-salt="${messages[i].salt}"><div class="chat-body"><div class="chat-top"><div class="user">${messages[i].sender}</div><div class="time">${messages[i].time}</div><div class="delete-message" data-id="${messages[i].salt}" onclick="deleteMessage('${messages[i].salt}')" uk-icon="icon: close; ratio: 0.8"></div></div><div class="chat-bottom">${messages[i].image ? '<img src="'+messages[i].text+'" style="max-width: 15%" alt="Изображение не загрузилось">' : '<span>'+messages[i].text+'</span>'}</div></div></div>`;
          
          $('.chat-window').prepend(li);
        }

        if (total) 
          $('.loadmore').remove();
      }
    }
  });
}

socket.on('get:message', (sender, message) => {
  if (sender !== 'all') return;
  
  let div = $('.chat-window');
  let li = `<div class="chat-buble ${message.sender == username ? 'you' : 'he'}" data-salt="${message.salt}"><div class="chat-body"><div class="chat-top"><div class="user">${message.sender}</div><div class="time">${message.time}</div><div class="delete-message" data-id="${message.salt}" onclick="deleteMessage('${message.salt}')" uk-icon="icon: close; ratio: 0.8"></div></div><div class="chat-bottom">${message.image ? '<img src="'+message.text+'" style="max-width: 15%" alt="Изображение не загрузилось">' : '<span>'+message.text+'</span>'}</div></div></div>`;

  div.append(li);
});

socket.on('remove:message', (sender, salt) => {
  if (sender !== 'all') return;
  $(`.chat-buble[data-salt="${salt}"]`).remove();
});