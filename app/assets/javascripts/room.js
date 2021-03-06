// BigBlueButton open source conferencing system - http://www.bigbluebutton.org/.
//
// Copyright (c) 2018 BigBlueButton Inc. and by respective authors (see below).
//
// This program is free software; you can redistribute it and/or modify it under the
// terms of the GNU Lesser General Public License as published by the Free Software
// Foundation; either version 3.0 of the License, or (at your option) any later
// version.
//
// BigBlueButton is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
// PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License along
// with BigBlueButton; if not, see <http://www.gnu.org/licenses/>.

// Room specific js for copy button and email link.
$(document).on('turbolinks:load', function(){
  var controller = $("body").data('controller');
  var action = $("body").data('action');

  // highlight current room
  $('.room-block').removeClass('current');
  $('a[href="' + window.location.pathname + '"] .room-block').addClass('current');

  // Only run on room pages.
  if (controller == "rooms" && action == "show"){
    var copy = $('#copy');

    // Handle copy button.
    copy.on('click', function(){
      var inviteURL = $('#invite-url');
      inviteURL.select();

      var success = document.execCommand("copy");
      if (success) {
        inviteURL.blur();
        copy.addClass('btn-success');
        copy.html("<i class='fas fa-check'></i>" + getLocalizedString("copied"))
        setTimeout(function(){
          copy.removeClass('btn-success');
          copy.html("<i class='fas fa-copy'></i>" + getLocalizedString("copy"))
        }, 2000)
      }
    });

    // Display and update all fields related to creating a room in the createRoomModal
    $("#create-room-block").click(function(){
      showCreateRoom(this)
    })
  }

    // Autofocus on the Room Name label when creating a room only
  $('#createRoomModal').on('shown.bs.modal', function (){
    if ($(".create-only").css("display") == "block"){
      $('#create-room-name').focus()
    }
  })

  if (controller == "rooms" && action == "show" || controller == "admins" && action == "server_rooms"){
    // Display and update all fields related to creating a room in the createRoomModal
    $(".update-room").click(function(){
      showUpdateRoom(this)
    })

    $(".delete-room").click(function() {
      showDeleteRoom(this)
    })

    $('.selectpicker').selectpicker({
      liveSearchPlaceholder: getLocalizedString('javascript.search.start')
    });
    // Fixes turbolinks issue with bootstrap select
    $(window).trigger('load.bs.select.data-api');

    $(".share-room").click(function() {
      // Update the path of save button
      $("#save-access").attr("data-path", $(this).data("path"))

      // Get list of users shared with and display them
      displaySharedUsers($(this).data("users-path"))
    })

    $("#shareRoomModal").on("show.bs.modal", function() {
      $(".selectpicker").selectpicker('val','')
    })

    $(".bootstrap-select").on("click", function() {
      $(".bs-searchbox").siblings().hide()
    })

    $(".bs-searchbox input").on("input", function() {
      if ($(".bs-searchbox input").val() == '' || $(".bs-searchbox input").val().length < 3) {
        $(".bs-searchbox").siblings().hide()
      } else {
        $(".bs-searchbox").siblings().show()
      }
    })

    $(".remove-share-room").click(function() {
      $("#remove-shared-confirm").parent().attr("action", $(this).data("path"))
    })

    // User selects an option from the Room Access dropdown
    $(".bootstrap-select").on("changed.bs.select", function(){
      // Get the uid of the selected user
      let uid = $(".selectpicker").selectpicker('val')

      // If the value was changed to blank, ignore it
      if (uid == "") return

      let currentListItems = $("#user-list li").toArray().map(user => $(user).data("uid"))

      // Check to make sure that the user is not already there
      if (!currentListItems.includes(uid)) {
        // Create the faded list item and display it
        let option = $("option[value='" + uid + "']")

        let listItem = document.createElement("li")
        listItem.setAttribute('class', 'list-group-item text-left not-saved add-access');
        listItem.setAttribute("data-uid", uid)

        let spanItem = "<span class='avatar float-left mr-2'>" + option.text().charAt(0) + "</span> <span class='shared-user'>" +
          option.text() + " <span class='text-muted'>" + option.data("subtext") + "</span></span>" +
          "<span class='text-primary float-right shared-user cursor-pointer' onclick='removeSharedUser(this)'><i class='fas fa-times'></i></span>"

        listItem.innerHTML = spanItem

        $("#user-list").append(listItem)
      }
    })
  }
});

function showCreateRoom(target) {
  $("#create-room-name").val("")
  $("#create-room-access-code").text(getLocalizedString("modal.create_room.access_code_placeholder"))
  $("#room_access_code").val(null)

  $("#createRoomModal form").attr("action", $("body").data('relative-root'))

  $("#room_mute_on_join").prop("checked", $("#room_mute_on_join").data("default"))
  $("#room_require_moderator_approval").prop("checked", $("#room_require_moderator_approval").data("default"))
  $("#room_anyone_can_start").prop("checked", $("#room_anyone_can_start").data("default"))
  $("#room_all_join_moderator").prop("checked", $("#room_all_join_moderator").data("default"))
  $("#room_generate_unauthenticated_name").prop("checked", $("#room_generate_unauthenticated_name").data("default"))

  //show all elements & their children with a create-only class
  $(".create-only").each(function() {
    $(this).show()
    if($(this).children().length > 0) { $(this).children().show() }
  })

  //hide all elements & their children with a update-only class
  $(".update-only").each(function() {
    $(this).attr('style',"display:none !important")
    if($(this).children().length > 0) { $(this).children().attr('style',"display:none !important") }
  })
}

function showUpdateRoom(target) {
  var modal = $(target)
  var update_path = modal.closest(".room-block").data("path")
  var settings_path = modal.data("settings-path")
  $("#create-room-name").val(modal.closest(".room-block").find(".room-name-text").text().trim())
  $("#createRoomModal form").attr("action", update_path)

  //show all elements & their children with a update-only class
  $(".update-only").each(function() {
    $(this).show()
    if($(this).children().length > 0) { $(this).children().show() }
  })

  //hide all elements & their children with a create-only class
  $(".create-only").each(function() {
    $(this).attr('style',"display:none !important")
    if($(this).children().length > 0) { $(this).children().attr('style',"display:none !important") }
  })

  updateCurrentSettings(settings_path)

  var accessCode = modal.closest(".room-block").data("room-access-code")

  if(accessCode){
    $("#create-room-access-code").text(getLocalizedString("modal.create_room.access_code") + ": " + accessCode)
    $("#room_access_code").val(accessCode)
  } else {
    $("#create-room-access-code").text(getLocalizedString("modal.create_room.access_code_placeholder"))
    $("#room_access_code").val(null)
  }
}

function showDeleteRoom(target) {
  $("#delete-header").text(getLocalizedString("modal.delete_room.confirm").replace("%{room}", $(target).data("name")))
  $("#delete-confirm").parent().attr("action", $(target).data("path"))
}

//Update the createRoomModal to show the correct current settings
function updateCurrentSettings(settings_path){
  // Get current room settings and set checkbox
  $.get(settings_path, function(room_settings) {
    var settings = JSON.parse(room_settings) 
    $("#room_mute_on_join").prop("checked", $("#room_mute_on_join").data("default") || settings.muteOnStart)
    $("#room_require_moderator_approval").prop("checked", $("#room_require_moderator_approval").data("default") || settings.requireModeratorApproval)
    $("#room_anyone_can_start").prop("checked", $("#room_anyone_can_start").data("default") || settings.anyoneCanStart)
    $("#room_all_join_moderator").prop("checked", $("#room_all_join_moderator").data("default") || settings.joinModerator)
    $("#room_generate_unauthenticated_name").prop("checked", $("#room_generate_unauthenticated_name").data("default") || settings.generateUnauthenticatedName)
  })
}

function generateAccessCode(){
  const accessCodeLength = 6
  var validCharacters = "0123456789"
  var accessCode = ""

  for( var i = 0; i < accessCodeLength; i++){
    accessCode += validCharacters.charAt(Math.floor(Math.random() * validCharacters.length));
  }

  $("#create-room-access-code").text(getLocalizedString("modal.create_room.access_code") + ": " + accessCode)
  $("#room_access_code").val(accessCode)
}

function ResetAccessCode(){
  $("#create-room-access-code").text(getLocalizedString("modal.create_room.access_code_placeholder"))
  $("#room_access_code").val(null)
}

function saveAccessChanges() {
  let listItemsToAdd = $("#user-list li:not(.remove-shared)").toArray().map(user => $(user).data("uid"))

  $.post($("#save-access").data("path"), {add: listItemsToAdd})
}

// Get list of users shared with and display them
function displaySharedUsers(path) {
  $.get(path, function(users) {
    // Create list element and add to user list
    var user_list_html = ""

    users.forEach(function(user) {
      user_list_html += "<li class='list-group-item text-left' data-uid='" + user.uid + "'>"

      if (user.image) {
        user_list_html += "<img id='user-image' class='avatar float-left mr-2' src='" + user.image + "'></img>"
      } else {
        user_list_html += "<span class='avatar float-left mr-2'>" + user.name.charAt(0) + "</span>"
      }
      user_list_html += "<span class='shared-user'>" + user.name + "<span class='text-muted ml-1'>" + user.uid + "</span></span>"
      user_list_html += "<span class='text-primary float-right shared-user cursor-pointer' onclick='removeSharedUser(this)'><i class='fas fa-times'></i></span>"
      user_list_html += "</li>"
    })

    $("#user-list").html(user_list_html)
  });
}

// Removes the user from the list of shared users
function removeSharedUser(target) {
  let parentLI = target.closest("li")

  if (parentLI.classList.contains("not-saved")) {
    parentLI.parentNode.removeChild(parentLI)
  } else {
    parentLI.removeChild(target)
    parentLI.classList.add("remove-shared")
  }
}
