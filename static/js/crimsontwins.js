;(function() {

now.ready(function() {
  now.setUrl = function(url) {
    console.log('Loading url in iframe');
    $('#container').html(
      $('iframe', {src: url})
    );
  };

  now.setImage = function(url) {
    console.log('Loading image');
    $('#container').html(
      $('<img/>', {src: url})
    );
  };

  ready('now');
});

function resize() {
  $('#container').css({
    width: window.innerWidth,
    height: window.innerHeight
  });
}

$(function() {
  $(window).on('resize', resize);
  resize();

  ready('dom');
});


var readyComponents = ['dom', 'now'];

function ready(component) {
  console.log(component + ' ready');
  var index = readyComponents.indexOf(component);
  if (index >= 0) {
    readyComponents.splice(index, 1);
  }

  if (!readyComponents.length) {
    console.log('all ready');
    allReady();
  }
}

function allReady() {
  now.imready();
}

})();
