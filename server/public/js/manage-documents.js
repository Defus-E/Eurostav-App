$(document).ready(function () {
  $('.add-news-button').on('click', () => {
    const form = $('form#edit-news');

    form.attr('action', '/news/add');

    $('input[name="title"]', form).val('');
    $('#editor .ql-editor').html('');
    $('#add-news-button').text('Добавить новость');
  });

  $('.delete_document').on('click', function (e) {
    e.preventDefault();

    const li = $(this).parent().parent();
    const url = $(li).attr('data-url-delete');
    const id = $(li).attr('data-id');

    $.ajax({
      url: url,
      type: 'POST',
      data: {
        id: id
      },
      dataType: 'JSON',
      statusCode: {
        200: ({total_count}) => {
          $(li).remove();
          if (total_count <= 10)
            $('.upload-documents').remove();
        }
      }
    })
  });

  $('.edit_document').on('click', function (e) {
    e.preventDefault();

    const li = $(this).parent().parent();
    const url = $(li).attr('data-url');
    const id = $(li).attr('data-id');
    const form = url == '/news/edit' ? $('form#edit-news') : $(`form[action="${url}"]`);
    
    switch (url) {
      case '/workers/edit':
        const fullname = $('.title', li).text().split(' ');
        const login = $(li).attr('data-login');

        $('a.more').attr('href', `/workers/profile?id=${id}`);
        $('input[name="login"]', form).val(login);
        $('input[name="firstname"]', form).val(fullname[0]);
        $('input[name="lastname"]', form).val(fullname[1]);
        $('input[name="id"]', form).val(id);
        break;

      case '/building/edit':
        const title = $('.title', li).text();
        const marks = $('.cranes', li).attr('data-marks');
        const series = $('.cranes', li).attr('data-series');
        const place = $(li).attr('data-place');
        const x = $(li).attr('data-x');
        const y = $(li).attr('data-y');

        $('input[name="title"]', form).val(title);
        $('input[name="x"]', form).val(x);
        $('input[name="y"]', form).val(y);
        $('input[name="marks"]', form).val(marks);
        $('input[name="series"]', form).val(series);
        $('input[name="id"]', form).val(id);
        $('select[name="place"]', form).val(place);
        break;

      case '/news/edit':
        $.get('/news/content', { id: id }, ({news}) => {
          if (!news) return;
          const titl = news.title;
          const content = news.content;

          form.attr('action', '/news/edit');
          $('#add-news-button', form).text('Применить');
            
          $('input[name="id"]', form).val(id);
          $('input[name="title"]', form).val(titl);
          $('#editor .ql-editor', form).html(content);
        });
        breal
      
      case '/settings/edit':
        const adminname = $('.title', li).text().split(' ');
        const login_admin = $(li).attr('data-login');

        $('input[name="login"]', form).val(login_admin);
        $('input[name="firstname"]', form).val(adminname[0]);
        $('input[name="lastname"]', form).val(adminname[1]);
        $('input[name="id"]', form).val(id);
        break;
    }
  });

  $('.2archive').on('click', function (e) {
    e.preventDefault();

    const a = $(this).find('a'); 
    const date = $(a).attr('data-date');

    $.ajax({
      type: 'POST',
      url: '/tables/archive',
      data: { date }
    });
  });

  $('.save').on('click', function (e) {
    if ($('input[name="firstname"]').val().trim() == '' || $('input[name="lastname"]').val().trim() == '')
      return alert('Имя и Фамилия не должны быть пусты!');

    const id = $(this).attr('data-id');
    const data = $('.info-worker :input').serialize();
    
    $.ajax({
      type: 'POST',
      url: '/workers/profile/save',
      data: `id=${id}&${data}`,
      statusCode: {
        200: () => alert('Сохранено')
      }
    });
  });

  $('input[type="file"]').on('change', function() {
    if (this.files && this.files[0]) {
      const formData = new FormData();
      const login = $(this).attr('data-login');

      formData.append("login", login);
      formData.append("avatar", this.files[0]);

      $.ajax({
        url: '/workers/profile/avatar',
        cache: false,
        contentType: false,
        processData: false,
        async: false,
        data: formData,
        type: 'POST',
        statusCode: {
          200: () => $('.photo img').attr('src', URL.createObjectURL(this.files[0])),
          412: () => alert('Изображение имеет неверный формат')
        }
      });
    }
  });
});