( function ( mw, $ ) {
	var settings = new mw.libs.revisionSlider.Settings(),
		autoExpand = settings.shouldAutoExpand(),
		expanded = autoExpand,
		autoExpandButton,
		toggleButton = OO.ui.ButtonWidget.static.infuse( $( '.mw-revslider-toggle-button' ) ),
		initialize = function() {
			var startTime = mw.now(),
				api = new mw.libs.revisionSlider.Api( mw.util.wikiScript( 'api' ) );

			mw.track( 'counter.MediaWiki.RevisionSlider.event.init' );
			mw.libs.revisionSlider.userOffset = mw.user.options.get( 'timecorrection' ) ? mw.user.options.get( 'timecorrection' ).split( '|' )[ 1 ] : mw.config.get( 'extRevisionSliderTimeOffset' );

			mw.libs.revisionSlider.HelpDialog.init();

			api.fetchRevisionData( mw.config.get( 'wgPageName' ), {
				startId: mw.config.get( 'extRevisionSliderNewRev' ),
				limit: mw.libs.revisionSlider.calculateRevisionsPerWindow( 160, 16 )
			} ).then( function ( data ) {
				var revs,
					revisionList,
					$container,
					slider;

				mw.track( 'timing.MediaWiki.RevisionSlider.timing.initFetchRevisionData', mw.now() - startTime );

				try {
					revs = data.revisions;
					revs.reverse();

					$container = $( '.mw-revslider-slider-wrapper' );

					revisionList = new mw.libs.revisionSlider.RevisionList( mw.libs.revisionSlider.makeRevisions( revs ) );
					revisionList.getView().setDir( $container.css( 'direction' ) || 'ltr' );

					slider = new mw.libs.revisionSlider.Slider( revisionList );
					slider.getView().render( $container );

					$( window ).on( 'resize', OO.ui.throttle( function () {
						slider.getView().render( $container );
					}, 250 ) );

					if ( !settings.shouldHideHelpDialogue() ) {
						mw.libs.revisionSlider.HelpDialog.show();
						settings.setHideHelpDialogue( true );
					}

					$( '.mw-revslider-placeholder' ).remove();
					mw.track( 'timing.MediaWiki.RevisionSlider.timing.init', mw.now() - startTime );
				} catch ( err ) {
					$( '.mw-revslider-placeholder' )
						.text( mw.message( 'revisionslider-loading-failed' ).text() );
					mw.log.error( err );
					mw.track( 'counter.MediaWiki.RevisionSlider.error.init' );
				}
			}, function ( err ) {
				$( '.mw-revslider-placeholder' )
					.text( mw.message( 'revisionslider-loading-failed' ).text() );
				mw.log.error( err );
				mw.track( 'counter.MediaWiki.RevisionSlider.error.init' );
			} );
		},

		expand = function () {
			toggleButton.setIcon( 'collapse' ).setTitle( mw.message( 'revisionslider-toggle-title-collapse' ).text() );
			$( '.mw-revslider-container' ).removeClass( 'mw-revslider-container-collapsed' )
				.addClass( 'mw-revslider-container-expanded' );
			$( '.mw-revslider-slider-wrapper' ).show();
			expanded = true;
		},

		collapse = function () {
			toggleButton.setIcon( 'expand' ).setTitle( mw.message( 'revisionslider-toggle-title-expand' ).text() );
			$( '.mw-revslider-container' ).removeClass( 'mw-revslider-container-expanded' )
				.addClass( 'mw-revslider-container-collapsed' );
			$( '.mw-revslider-slider-wrapper' ).hide();
		};

	autoExpandButton = new OO.ui.ToggleButtonWidget( {
		icon: 'pin',
		classes: [ 'mw-revslider-auto-expand-button' ],
		title: mw.message( autoExpand ?
			'revisionslider-turn-off-auto-expand-title' :
			'revisionslider-turn-on-auto-expand-title'
		).text(),
		value: autoExpand
	} );

	autoExpandButton.connect( this, {
		click: function () {
			autoExpand = !autoExpand;
			settings.setAutoExpand( autoExpand );
			if ( autoExpand ) {
				autoExpandButton.setTitle( mw.message( 'revisionslider-turn-off-auto-expand-title' ).text() );
				expand();
				mw.track( 'counter.MediaWiki.RevisionSlider.event.autoexpand_on' );
			} else {
				autoExpandButton.setTitle( mw.message( 'revisionslider-turn-on-auto-expand-title' ).text() );
				mw.track( 'counter.MediaWiki.RevisionSlider.event.autoexpand_off' );
			}
		}
	} );

	$( '.mw-revslider-container' ).append( autoExpandButton.$element );

	toggleButton.connect( this, {
		click: function () {
			expanded = !expanded;
			if ( expanded ) {
				expand();
				mw.track( 'counter.MediaWiki.RevisionSlider.event.expand' );
				mw.hook( 'revslider.expand' ).fire();
			} else {
				collapse();
				mw.track( 'counter.MediaWiki.RevisionSlider.event.collapse' );
				mw.hook( 'revslider.collapse' ).fire();
			}
		}
	} );

	if ( mw.config.get( 'extRevisionSliderBeta' ) ) {
		mw.loader.load( 'ext.RevisionSlider.SliderViewTwo' );
	}
	expand();
	initialize();

}( mediaWiki, jQuery ) );
