function showLoader(){
  $('#loadingSpinnerContainer').show();
}
function hideLoader(){
  $('#loadingSpinnerContainer').hide();
}
copyToClipboard = function(text) {
if (window.clipboardData && window.clipboardData.setData) {
    // IE specific code path to prevent textarea being shown while dialog is visible.
    return clipboardData.setData("Text", text); 

} else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
    var textarea = document.createElement("textarea");
    textarea.textContent = text;
    textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
    document.body.appendChild(textarea);
    textarea.select();
    try {
        return document.execCommand("copy");  // Security exception may be thrown by some browsers.
    } catch (ex) {
        console.warn("Copy to clipboard failed.", ex);
        return false;
    } finally {
        document.body.removeChild(textarea);
    }
}}
function isJsonString(str) {
	try {
			j = JSON.parse(str);
	} catch (e) {
			return false;
	}
	return true;
}

var open = true;
function toggleSide(){
  if (open){
    $('.side').toggle();
  } else{
    $('.side-min').fadeOut();
  }
  $( ".mainArea" ).animate({
    left: ( open ? "0" : "300")
  }, 500, function() {
    if (open){
      $('.side').toggle();
    } else
      $('.side-min').fadeIn();
  });
  open = !open;
}