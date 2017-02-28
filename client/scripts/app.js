// YOUR CODE HERE:
var app = {
  server: 'http://127.0.0.1:3000/classes/messages/',
  friendsList: []
};

app.init = (function() {
  var executed = false;

  return function() {
    if (!executed) {
      executed = true;
      $(document).ready(function() {

        $(this).on('click', '.username', function(event) {
          event.preventDefault();
          $(this).addClass('friend');
          app.friendsList.push($(this).text());
          app.handleUsernameClick($(this).text());
        }); 

        $('#roomSelect').on('change', function(event) {
          if ($('#roomSelect').val() === 'New Room...') {
            $('.newChat').show();
          } else {
            $('.newChat').hide();
          }
          var selectedVal = $(this).find(':selected').val();
          var selectedText = $(this).find(':selected').text();
        });

        $('#roomSelect').on('change', function(event) {
          event.preventDefault();
          //var selectedVal = $(this).find(':selected').val();
          //var selectedText = $(this).find(':selected').text();
          app.clearMessages();
          app.fetch();
        }); 


        $('#send').submit(function(event) {
          event.preventDefault();
          app.handleSubmit();
        });

        app.fetch();
      });
    }
  };
})();

//Ask Erik why we need to call this after immediately invoking 
app.init();

app.send = function(message) {
  $.ajax({
    url: app.server,
    type: 'POST',
    data: JSON.stringify(message),
    //datatype: 'json',
    contentType: 'application/json',
    success: function (data) {
      console.log('chatterbox: Message sent');
    },
    error: function (data) {
      console.error('chatterbox: Failed to send message', data);
    }
  });  
  // $.post('http://parse.sfm6.hackreactor.com/chatterbox/classes/messages', JSON.stringify(message), function (data) {
  //   console.log('chatterbox: Message sent');
  // }, 'application/json');
};

app.fetch = function() {
  // app.clearMessages();
  $.ajax({
    url: app.server,
    type: 'GET',
    //datatype: 'json',
    contentType: 'application/json',
    data: 'order=-createdAt',
    success: function (data) {
      console.log(data);
      app.clearMessages();
      data.results.forEach(function(object) {
        if (object.username === undefined || object.username.includes('%')) {

        } else {
          app.renderRoom(object);
          app.renderMessage(object);
          app.handleUsernameClick(object.username); 
        }
      });
      console.log('chatterbox: Message received');
    },
    error: function (data) {
      console.error('chatterbox: Failed to receive message', data);
    }
  });
  setTimeout(function() {
    app.fetch();
  }, 10000);
};

app.clearMessages = function() {
  $('#chats').children().remove();
};


app.renderMessage = function(message) {
  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  var escapeHtml = function (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
      return entityMap[s];
    });
  };

  var formatTime = function(time) {
    return jQuery.timeago(time);
  };

  var cleanUserName = escapeHtml(message.username);
  var cleanRoomName = escapeHtml(message.roomname);
  var cleanText = escapeHtml(message.text);

  var selectedRoomName = document.getElementById('roomSelect').value;
  var dataUserName = '<a href="#/" class="username" id="' + cleanUserName + '">' + cleanUserName + '</a>'; 
  if (app.friendsList.indexOf(String(cleanUserName)) >= 0) {
    $('#' + cleanUserName).addClass('friend'); 
  }
  var dataRoomName = cleanRoomName;
  var dataText = cleanText;
  var text = '<div class=".message"><p class="chat">' + dataUserName + ':' + dataText + '</p></div>';
  $('.message').addClass(dataRoomName);
  if ( selectedRoomName === 'All Room') {
    $('#chats').append(text);
  } else {
    if (selectedRoomName === dataRoomName) {
      $('#chats').append(text);
    }
  }
};

app.renderRoom = function(message) {

  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  var escapeHtml = function (string) {
    return String(string).replace(/[^\w]/g, function (s) {
      return entityMap[s];
    });
  };

  var cleanRoomName = escapeHtml(message.roomname);
  //cleanRoomName = cleanRoomName.slice(0, 10);
  if ( $('#roomSelect option[value="' + cleanRoomName + '"]').length === 0 ) {
    var room = '<option value="' + cleanRoomName + '">' + cleanRoomName + '</option>';
    $('#roomSelect').append(room);
  }
};

app.handleUsernameClick = function (username) {
  $('.username').each(function() { 
    if (this.innerText === username && app.friendsList.indexOf(username) !== -1) {
      $(this).addClass('friend');
    }
  });
};

app.handleSubmit = function () {
  var textWritten = document.getElementById('message').value;
  var theRoomName;
  if ($('#roomSelect').val() === 'New Room...') {
    theRoomName = $('#newRoom').val();
    console.log('I am called');
  } else {
    theRoomName = document.getElementById('roomSelect').value;
  }
  var userName = window.location.search.slice(10);
  var message = {
    username: userName,
    text: textWritten,
    roomname: theRoomName
  };
  console.log(message);
  app.send(message);
};

// setInterval(app.fetch, 5000);
