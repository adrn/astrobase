// cpserver.js - Waqas Bhatti (wbhatti@astro.princeton.edu) - Jan 2017
// License: MIT. See LICENSE for the full text.
//
// This contains the JS to drive the checkplotserver's interface.
//

//////////////
// JS BELOW //
//////////////

// this contains utility functions
var cputils = {

    // this encodes a string to base64
    // https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
    b64_encode: function (str) {
        return btoa(
            encodeURIComponent(str)
                .replace(/%([0-9A-F]{2})/g,
                         function(match, p1) {
                             return String.fromCharCode('0x' + p1);
                         }));
    },

    // this turns a base64 string into an image by updating its source
    b64_to_image: function (str, targetelem) {

        var datauri = 'data:image/png;base64,' + str;
        $(targetelem).attr('src',datauri);

    }

};


// this contains updates to current checkplots
var cptracker = {
};


// this is the container for the main functions
var cpv = {
    // these hold the current checkplot's data and filename respectively
    currfile: '',
    currcp:'',

    // this function generates a spinner
    make_spinner: function (spinnermsg) {

        var spinner =
            '<div class="spinner">' +
            spinnermsg +
            '<div class="rect1"></div>' +
            '<div class="rect2"></div>' +
            '<div class="rect3"></div>' +
            '<div class="rect4"></div>' +
            '<div class="rect5"></div>' +
            '</div>';

        $('#alert-box').html(spinner);

    },

    // this function generates an alert box
    make_alert: function (alertmsg) {

        var alert =
            '<div class="alert alert-warning alert-dismissible fade show" ' +
            'role="alert">' +
            '<button type="button" class="close" data-dismiss="alert" ' +
            'aria-label="Close">' +
            '<span aria-hidden="true">&times;</span>' +
            '</button>' +
            alertmsg +
            '</div>';

        $('#alert-box').html(alert);

    },

    // this loads a checkplot from an image file into an HTML canvas object
    load_checkplot: function (filename) {

        console.log('loading ' + filename);

        // start the spinny thing
        cpv.make_spinner('loading...');

        // build the title for this current file
        var plottitle = $('#checkplot-current');
        var filelink = filename;
        var objectidelem = $('#objectid');
        var twomassidelem = $('#twomassid');

        plottitle.html(filelink);

        if (cpv.currfile.length > 0) {
            // un-highlight the previous file in side bar
            $("a[data-fname='" + cpv.currfile + "']").unwrap();
        }

        // do the AJAX call to get this checkplot
        var ajaxurl = '/cp/' + cputils.b64_encode(filename);

        $.getJSON(ajaxurl, function (data) {

            cpv.currcp = data.result;
            console.log('received cp for ' + cpv.currcp.objectid);

            /////////////////////////////////////////////////
            // update the UI with elems for this checkplot //
            /////////////////////////////////////////////////


            // update the objectid header
            objectidelem.html(cpv.currcp.objectid);
            // update the twomassid header
            twomassidelem.html('2MASS J' + cpv.currcp.objectinfo.twomassid);

            // update the finder chart
            cputils.b64_to_image(cpv.currcp.finderchart,
                                 '#finderchart');

            // update the objectinfo
            var hatinfo = '<strong>' +
                (cpv.currcp.objectinfo.stations.split(',')).join(', ') +
                '</strong><br>' +
                '<strong>LC points:</strong> ' +
                cpv.currcp.objectinfo.ndet;
            $('#hatinfo').html(hatinfo);

            var coordspm =
                '<strong>RA, Dec:</strong> ' +
                '<a title="SIMBAD search at these coordinates" ' +
                'href="http://simbad.u-strasbg.fr/simbad/sim-coo?Coord=' +
                cpv.currcp.objectinfo.ra + '+' + cpv.currcp.objectinfo.decl +
                '&Radius=1&Radius.unit=arcmin' +
                '" rel="nofollow" target="_blank">' +
                math.format(cpv.currcp.objectinfo.ra,6) + ', ' +
                math.format(cpv.currcp.objectinfo.decl,6) + '</a><br>' +
                '<strong>Total PM:</strong> ' +
                math.format(cpv.currcp.objectinfo.propermotion,5) +
                ' mas/yr<br>' +
                '<strong>Reduced PM:</strong> ' +
                math.format(cpv.currcp.objectinfo.reducedpropermotion,4);
            $('#coordspm').html(coordspm);

            var mags = '<strong><em>gri</em>:</strong> ' +
                math.format(cpv.currcp.objectinfo.sdssg,5) + ', ' +
                math.format(cpv.currcp.objectinfo.sdssr,5) + ', ' +
                math.format(cpv.currcp.objectinfo.sdssi,5) + '<br>' +
                '<strong><em>JHK</em>:</strong> ' +
                math.format(cpv.currcp.objectinfo.jmag,5) + ', ' +
                math.format(cpv.currcp.objectinfo.hmag,5) + ', ' +
                math.format(cpv.currcp.objectinfo.kmag,5) + '<br>' +
                '<strong><em>BV</em>:</strong> ' +
                math.format(cpv.currcp.objectinfo.bmag,5) + ', ' +
                math.format(cpv.currcp.objectinfo.vmag,5);
            $('#mags').html(mags);

            var colors = '<strong><em>B - V</em>:</strong> ' +
                math.format(cpv.currcp.objectinfo.bvcolor,4) + '<br>' +
                '<strong><em>i - J</em>:</strong> ' +
                math.format(cpv.currcp.objectinfo.ijcolor,4) + '<br>' +
                '<strong><em>J - K</em>:</strong> ' +
                math.format(cpv.currcp.objectinfo.jkcolor,4);
            $('#colors').html(colors);

            // update the magseries plot
            cputils.b64_to_image(cpv.currcp.magseries,
                                '#magseriesplot');

            // update the varinfo
            if (cpv.currcp.varinfo.objectisvar == true) {
                $('#varcheck-yes').prop('checked',true);
                $('#varcheck-yeslabel').addClass('active');

                $('#varcheck-maybe').prop('checked',false);
                $('#varcheck-maybelabel').removeClass('active');

                $('#varcheck-no').prop('checked',false);
                $('#varcheck-nolabel').removeClass('active');

            }
            else if (cpv.currcp.varinfo.objectisvar == false) {
                $('#varcheck-no').prop('checked',true);
                $('#varcheck-nolabel').addClass('active');

                $('#varcheck-yes').prop('checked',false);
                $('#varcheck-yeslabel').removeClass('active');

                $('#varcheck-maybe').prop('checked',false);
                $('#varcheck-maybelabel').removeClass('active');
            }
            else {

                $('#varcheck-maybe').prop('checked',true);
                $('#varcheck-maybelabel').addClass('active');

                $('#varcheck-yes').prop('checked',false);
                $('#varcheck-yeslabel').removeClass('active');

                $('#varcheck-no').prop('checked',false);
                $('#varcheck-nolabel').removeClass('active');
            }
            $('#objectperiod').val(cpv.currcp.varinfo.varperiod);
            $('#objectepoch').val(cpv.currcp.varinfo.varepoch);
            $('#objecttags').val(cpv.currcp.objectinfo.objecttags);
            $('#objectcomments').val(cpv.currcp.objectcomments);
            $('#vartags').val(cpv.currcp.varinfo.vartags);

            // update the phased light curves

            // first, count the number of methods we have in the cp
            var lspmethods = [];
            var ncols = 0;

            if ('pdm' in cpv.currcp) {
                lspmethods.push('pdm');
                ncols = ncols + 1;
            }
            if ('gls' in cpv.currcp) {
                lspmethods.push('gls');
                ncols = ncols + 1;
            }
            if ('bls' in cpv.currcp) {
                lspmethods.push('bls');
                ncols = ncols + 1;
            }
            if ('aov' in cpv.currcp) {
                lspmethods.push('aov');
                ncols = ncols + 1;
            }

            var colwidth = 12/ncols;

            // zero out previous stuff
            $('.phased-container').empty();

            // then go through each lsp method, and generate the containers
            for (let lspmethod of lspmethods) {

                if (lspmethod in cpv.currcp) {

                    var nbestperiods = cpv.currcp[lspmethod].nbestperiods;
                    var periodogram = cpv.currcp[lspmethod].periodogram;

                    // start putting together the container for this method
                    var mcontainer_coltop =
                        '<div class="col-sm-' + colwidth +
                        '" "data-lspmethod="' + lspmethod + '">';
                    var mcontainer_colbot = '</div>';

                    var periodogram_row =
                        '<div class="row periodogram-container">' +
                        '<div class="col-sm-12">' +
                        '<img src="data:image/png;base64,' +
                        cpv.currcp[lspmethod].periodogram + '" ' +
                        'class="img-fluid" id="periodogram-' +
                        lspmethod + '">' + '</div></div>';

                    var phasedlcrows= [];

                    // up to 5 periods are possible
                    var periodindexes = ['phasedlc0',
                                         'phasedlc1',
                                         'phasedlc2',
                                         'phasedlc3',
                                         'phasedlc4'];

                    for (let periodind of periodindexes) {

                        if (periodind in cpv.currcp[lspmethod]) {

                            var phasedlcrow =
                                '<a href="#" class="phasedlc-select" ' +
                                'title="use this period and epoch" ' +
                                'data-lspmethod="' + lspmethod + '" ' +
                                'data-periodind="' + periodind + '" ' +
                                'data-currentbest="no" ' +
                                'data-period="' +
                                cpv.currcp[lspmethod][periodind].period + '" ' +
                                'data-epoch="' +
                                cpv.currcp[lspmethod][periodind].epoch + '">' +
                                '<div class="row py-1 phasedlc-container-row" ' +
                                'data-periodind="' + periodind + '">' +
                                '<div class="col-sm-12">' +
                                '<img src="data:image/png;base64,' +
                                cpv.currcp[lspmethod][periodind].plot + '"' +
                                'class="img-fluid" id="plot-' +
                                periodind + '">' + '</div></div></a>';
                            phasedlcrows.push(phasedlcrow);

                        }

                    }

                    // now that we've collected everything, generate the
                    // container column
                    var mcontainer = mcontainer_coltop + periodogram_row +
                        phasedlcrows.join(' ') + mcontainer_colbot;

                    // write the column to the phasedlc-container
                    $('.phased-container').append(mcontainer);

                }

            }


        }).done(function () {

            console.log('done with cp');

            // update the current file tracker
            cpv.currfile = filename;
            // highlight the file in the sidebar list
            $("a[data-fname='" + filename + "']").wrap('<strong></strong>')

            // fix the height of the sidebar as required
            var winheight = $(window).height();
            var docheight = $(document).height();
            var ctrlheight = $('.sidebar-controls').height()

            $('.sidebar').css({'height': docheight + 'px'});

            // get rid of the spinny thing
            $('#alert-box').empty();

        }).fail (function (xhr) {

            cpv.make_alert('could not load checkplot <strong>' +
                           filename + '</strong>!');
            console.log('cp loading failed from ' + ajaxurl);

        });


    },

    // this functions saves the current checkplot by doing a POST request to the
    // backend. this MUST be called on every checkplot list action (i.e. next,
    // prev, before load of a new checkplot, so changes are always saved). UI
    // elements in the checkplot list will tag the saved checkplots
    // appropriately
    save_checkplot: function () {

        // first, generate the object to send with the POST request
        var postobj = {cpfile: cpv.currfile,
                       cpcontents: cpv.currcp};

        // next, do a saving animation in the alert box


        // next, send the POST request


        // on POST done, update the UI elements in the checkplot list

        // if POST failed, inform the user by popping up an alert in the alert
        // box


    },


    // this binds actions to the web-app controls
    action_setup: function () {

        // the previous checkplot link
        $('.checkplot-prev').on('click',function (evt) {

            evt.preventDefault();

            // find the current index
            var currindex = cpv.filelist.indexOf(cpv.currfile);
            var prevfile = cpv.filelist[currindex-1];
            if (prevfile != undefined) {
                cpv.load_checkplot(prevfile);
            }

        });

        // the next checkplot link
        $('.checkplot-next').on('click',function (evt) {

            evt.preventDefault();

            // find the current index
            var currindex = cpv.filelist.indexOf(cpv.currfile);
            var nextfile = cpv.filelist[currindex+1];
            if (nextfile != undefined) {
                cpv.load_checkplot(nextfile);
            }

        });

        // clicking on a checkplot file in the sidebar
        $('#checkplotlist').on('click', '.checkplot-load', function (evt) {

            evt.preventDefault();

            var filetoload = $(this).attr('data-fname');
            console.log('file to load: ' + filetoload);

            // ask the backend for this file
            cpv.load_checkplot(filetoload);

        });

        // clicking on a phased LC loads its period and epoch into the boxes
        // also saves them to the currcp
        $('.phased-container').on('click','.phasedlc-select', function (evt) {

            evt.preventDefault();

            var period = $(this).attr('data-period');
            var epoch = $(this).attr('data-epoch');

            console.log('period selected = ' + period);
            console.log('epoch selected = ' + epoch);

            // update the boxes
            $('#objectperiod').val(period);
            $('#objectepoch').val(epoch);

            // save to currcp
            cpv.currcp.varinfo.varperiod = parseFloat(period);
            cpv.currcp.varinfo.varepoch = parseFloat(epoch);

            // add a selected class
            var selector = '[data-periodind="' +
                $(this).attr('data-periodind') +
                '"]';
            $('.phasedlc-container-row').removeClass('phasedlc-selected');
            $(this)
                .children('.phasedlc-container-row')
                .filter(selector).addClass('phasedlc-selected');

        });

        // clicking on the is-object-variable control saves the info to currcp
        $('.varcheck').on('click', function (evt) {

            var varcheckval = $("input[name='varcheck']").val()

            console.log('objectisvar = ' + varcheckval);

            if (varcheckval == 'no') {
                cpv.currcp.varinfo.objectisvar = true;
            }
            else if (varcheckval == 'no') {
                cpv.currcp.varinfo.objectisvar = false;
            }
            else if (varcheckval == 'maybe') {
                cpv.currcp.varinfo.objectisvar = null;
            }

        });


        // resizing the window fixes the sidebar again
        $(window).on('resize', function (evt) {

            // fix the height of the sidebar as required
            var winheight = $(window).height();
            var docheight = $(document).height();
            var ctrlheight = $('.sidebar-controls').height()

            $('.sidebar').css({'height': docheight + 'px'});

        });


    }

};