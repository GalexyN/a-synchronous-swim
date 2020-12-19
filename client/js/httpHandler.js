(function() {

  const serverUrl = 'http://127.0.0.1:3000';

  //
  // TODO: build the swim command fetcher here
  //

  /////////////////////////////////////////////////////////////////////
  // The ajax file uploader is provided for your convenience!
  // Note: remember to fix the URL below.
  /////////////////////////////////////////////////////////////////////

  const ajaxRandomCommand = () => {
    // var formData = new FormData();
    // formData.append('file', file);
    $.ajax({
      url: serverUrl,
      success: data => {
        SwimTeam.move(data);
      },
    });
  };

  setInterval(() => ajaxRandomCommand(), 5000);



  const ajaxFileUpload = (file) => {
    var formData = new FormData();
    formData.append('file', file);
    $.ajax({
      type: 'POST',
      data: formData,
      url: serverUrl + '/background',
      cache: false,
      contentType: file.type,
      processData: false,
      success: () => {
        console.log('success');
        // reload the page
        window.location = window.location.href;
      }
    });
  };

  $('form').on('submit', function(e) {
    e.preventDefault();

    var form = $('form .file')[0];
    if (form.files.length === 0) {
      console.log('No file selected!');
      return;
    }

    var file = form.files[0];
    if (!(file.type === 'image/jpeg' || file.type === 'image/png')) {
      console.log('Not a jpg / png file!');
      return;
    }

    ajaxFileUpload(file);
  });

})();
