// JavaScript Document

$(document).ready(function(e) {
	$('.page-menu .navicon').on('click', function(e) {
		$('.page-menu .global-links')
			.addClass('pos-fxd overlay apply-theme txt-align-cntr z-index-behind')
			.removeClass('d-none--on-lg');
		$('.page-menu .global-links ul').removeClass('flex-y-center flex-wrap pd-lft-md kids--mg-hz-md');
		$('.page-menu .global-links ul a').removeClass('ht-50 flex-y-center').addClass('d-inline-block pd-vt-lg anim-bounce-in-left');
		$(this).removeClass('d-flex--on-lg');
		$('.page-menu .xicon').removeClass('d-none');
	});
	$('.page-menu .xicon').on('click', function(e) {
		$('.page-menu .global-links')
			.removeClass('pos-fxd overlay apply-theme txt-align-cntr z-index-behind')
			.addClass('d-none--on-lg');
		$('.page-menu .global-links ul').addClass('flex-y-center flex-wrap pd-lft-md kids--mg-hz-md');
		$('.page-menu .global-links ul a').removeClass('d-inline-block pd-vt-lg anim-bounce-in-left').addClass('ht-50 flex-y-center');
		$(this).addClass('d-none');
		$('.page-menu .navicon').addClass('d-flex--on-lg');
	});

	Dramatic.ui.begin();
	

	Dramatic.view.make('presentation', {art: 'fa:cog', label:'Test Label', desc:'test desc', }, $('body')).render();
	/**
	setTimeout(function() {
		var a = Dramatic.view.make('component', {label: 'What is your name?'});
		console.log($('body').append(a.render().element.html()));
	}, 400);
	*/
});
