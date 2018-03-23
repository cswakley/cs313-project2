function getComments(videoId){
	console.log(videoId);
	$.ajax(
	{
		type: 'GET',
		url: 'http://localhost:5000/comments?vid=' + videoId,
		success: function(response) {
			console.log(response.Search);
			for (var index in response.Search){
				$("#comments").append(response.Search[index].username + ": " + response.Search[index].message + "<br>");
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown){
			$("#comments").append("There was an error retreiving the comments");
		}
	});
}