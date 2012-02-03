
$(function() {

  $('#response').hide();
  $('form').submit(function() {
    
    $.post('/login', { 
        email: $('#email').val(),
        password: $('#password').val()
      }, function(data, textStatus) {
    
      $('#response').html(data || testStatus).show();
      
    });
    
    return false;
  });
});