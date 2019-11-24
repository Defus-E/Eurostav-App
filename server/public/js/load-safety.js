$(document).ready(function () {
  $('form.safety-editor').on('submit', function (e) { 
    e.preventDefault();

    const form = this;

    $.ajax({
      url: $(form).attr('action'),
      type: $(form).attr('method'),
      data: `content=${$('#safety-editor .ql-editor').html()}`
    })
  });
});