document.querySelectorAll(".tab-btn").forEach((button) => {
  button.addEventListener("click", function () {
    document
      .querySelectorAll(".tab-btn")
      .forEach((btn) => btn.classList.remove("active"));
    this.classList.add("active");

    document
      .querySelectorAll(".tab-content")
      .forEach((tab) => tab.classList.remove("active"));
    document.getElementById(this.dataset.tab).classList.add("active");
  });
});

document
  .getElementById("manualEntryToggle")
  .addEventListener("change", function () {
    if (this.checked) {
      document.getElementById("selectChatSection").style.display = "none";
      document.getElementById("manualEntrySection").style.display = "block";
      clearSelectedChat();
      updateTargetJid("");
    } else {
      document.getElementById("selectChatSection").style.display = "block";
      document.getElementById("manualEntrySection").style.display = "none";
      document.getElementById("manualJid").value = "";
      updateTargetJid("");
    }
  });

document
  .getElementById("manualGroupToggle")
  .addEventListener("change", function () {
    if (this.checked) {
      document.getElementById("selectGroupSection").style.display = "none";
      document.getElementById("manualGroupSection").style.display = "block";
      clearSelectedGroup();
      updateTagGroupId("");
    } else {
      document.getElementById("selectGroupSection").style.display = "block";
      document.getElementById("manualGroupSection").style.display = "none";
      document.getElementById("manualGroupId").value = "";
      updateTagGroupId("");
    }
  });

function updateTargetJid(value) {
  document.getElementById("targetJid").value = value;
}

function updateTagGroupId(value) {
  document.getElementById("tagGroupId").value = value;
}

function clearSelectedChat() {
  document.querySelectorAll("#chatList .chat-item").forEach((item) => {
    item.classList.remove("selected");
  });
}

function clearSelectedGroup() {
  document.querySelectorAll("#groupList .chat-item").forEach((item) => {
    item.classList.remove("selected");
  });
}

document.getElementById("chatSearch").addEventListener("input", function () {
  const searchTerm = this.value.toLowerCase();
  const chatItems = document.querySelectorAll("#chatList .chat-item");

  chatItems.forEach((item) => {
    const chatName = item.querySelector(".chat-name").textContent.toLowerCase();
    const chatId = item.querySelector(".chat-id").textContent.toLowerCase();

    if (chatName.includes(searchTerm) || chatId.includes(searchTerm)) {
      item.style.display = "";
    } else {
      item.style.display = "none";
    }
  });

  const visibleItems = document.querySelectorAll(
    "#chatList .chat-item[style='display: none;']",
  );
  const emptyMessage =
    document.querySelector("#chatList .empty-list-message") ||
    document.createElement("div");

  if (visibleItems.length === chatItems.length && chatItems.length > 0) {
    emptyMessage.className = "empty-list-message";
    emptyMessage.textContent = "Tidak ada hasil yang cocok";
    if (!document.querySelector("#chatList .empty-list-message")) {
      document.getElementById("chatList").appendChild(emptyMessage);
    }
  } else if (document.querySelector("#chatList .empty-list-message")) {
    document.querySelector("#chatList .empty-list-message").remove();
  }
});

document.getElementById("groupSearch").addEventListener("input", function () {
  const searchTerm = this.value.toLowerCase();
  const groupItems = document.querySelectorAll("#groupList .chat-item");

  groupItems.forEach((item) => {
    const groupName = item
      .querySelector(".chat-name")
      .textContent.toLowerCase();
    const groupId = item.querySelector(".chat-id").textContent.toLowerCase();

    if (groupName.includes(searchTerm) || groupId.includes(searchTerm)) {
      item.style.display = "";
    } else {
      item.style.display = "none";
    }
  });

  const visibleItems = document.querySelectorAll(
    "#groupList .chat-item[style='display: none;']",
  );
  const emptyMessage =
    document.querySelector("#groupList .empty-list-message") ||
    document.createElement("div");

  if (visibleItems.length === groupItems.length && groupItems.length > 0) {
    emptyMessage.className = "empty-list-message";
    emptyMessage.textContent = "Tidak ada hasil yang cocok";
    if (!document.querySelector("#groupList .empty-list-message")) {
      document.getElementById("groupList").appendChild(emptyMessage);
    }
  } else if (document.querySelector("#groupList .empty-list-message")) {
    document.querySelector("#groupList .empty-list-message").remove();
  }
});

async function deleteSession() {
  if (!confirm("Yakin ingin menghapus session?")) return;
  try {
    const res = await fetch("/session", { method: "DELETE" });
    const data = await res.json();
    alert(data.status || data.error);
  } catch (error) {
    alert("Error saat menghapus session: " + error.message);
  }
}

function createChatItem({ chatId, chatName, isGroup, onClick }) {
  const initial = chatName.charAt(0).toUpperCase();

  const chatItem = document.createElement("div");
  chatItem.className = "chat-item";
  chatItem.dataset.id = chatId;
  chatItem.dataset.isGroup = isGroup;
  chatItem.innerHTML = `
    <div class="chat-icon">${initial}</div>
    <div class="chat-details">
      <div class="chat-name">${chatName}</div>
      <div class="chat-id">${chatId}</div>
    </div>
  `;

  chatItem.addEventListener("click", onClick);

  return chatItem;
}

async function loadChats() {
  try {
    const res = await fetch("/chats");
    const { groups } = await res.json();
    const chatList = document.getElementById("chatList");
    const groupList = document.getElementById("groupList");

    chatList.innerHTML = "";
    groupList.innerHTML = "";

    if (groups.length === 0) {
      chatList.innerHTML =
        '<div class="empty-list-message">Tidak ada grup tersedia</div>';
      groupList.innerHTML =
        '<div class="empty-list-message">Tidak ada grup tersedia</div>';
      return;
    }

    groups.forEach((chat) => {
      const chatId = chat.id.includes("@g.us") ? chat.id : `${chat.id}@g.us`;
      const chatName = chat.subject || chat.name || chat.id;
      const isGroup = chat.isGroup;

      const personalItem = createChatItem({
        chatId,
        chatName,
        isGroup,
        onClick: function () {
          clearSelectedChat();
          this.classList.add("selected");
          updateTargetJid(this.dataset.id);
        },
      });

      chatList.appendChild(personalItem);

      const groupItem = createChatItem({
        chatId,
        chatName,
        isGroup,
        onClick: function () {
          clearSelectedGroup();
          this.classList.add("selected");
          updateTagGroupId(this.dataset.id);
        },
      });

      groupList.appendChild(groupItem);
    });
  } catch (error) {
    console.error("Error loading chats:", error);
    document.getElementById("chatList").innerHTML =
      '<div class="empty-list-message">Error memuat chat</div>';
    document.getElementById("groupList").innerHTML =
      '<div class="empty-list-message">Error memuat grup</div>';
  }
}

document.getElementById("manualJid").addEventListener("input", function () {
  let value = this.value;

  if (value && !value.includes("@")) {
    if (value.match(/^\d+$/)) {
      value += "@s.whatsapp.net";
    } else {
      value += "@g.us";
    }
  }

  updateTargetJid(value);

  if (value.includes("@s.whatsapp.net")) {
    document.getElementById("participant").value = value;
  }
});

document.getElementById("manualGroupId").addEventListener("input", function () {
  let value = this.value;

  if (value && !value.includes("@")) {
    value += "@g.us";
  } else if (value && !value.includes("@g.us")) {
    value = value.split("@")[0] + "@g.us";
  }

  updateTagGroupId(value);
});

document
  .getElementById("fakeReplyForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const targetJid = document.getElementById("targetJid").value;
    let participant = document.getElementById("participant").value;
    const quotedText = document.getElementById("quotedText").value;
    const yourMessage = document.getElementById("yourMessage").value;

    if (participant && !participant.includes("@")) {
      participant += "@s.whatsapp.net";
    }

    try {
      const res = await fetch("/send-fake-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetJid,
          participant,
          quotedText,
          yourMessage,
        }),
      });

      const result = await res.json();
      alert(
        result.status === "sent"
          ? "Pesan terkirim!"
          : "Gagal mengirim: " + (result.error || "Unknown error"),
      );
    } catch (error) {
      alert("Error saat mengirim pesan: " + error.message);
    }
  });

document.getElementById("tagAllForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const groupid = document.getElementById("tagGroupId").value;
  const message = document.getElementById("tagMessage").value;

  if (!groupid || !groupid.endsWith("@g.us")) {
    alert("ID Grup tidak valid! Harus diakhiri dengan @g.us");
    return;
  }

  try {
    const res = await fetch("/tagall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupid,
        message,
      }),
    });

    const result = await res.json();
    alert(
      result.status === "sent"
        ? "Berhasil mengirim tag all!"
        : "Gagal tag all: " + (result.error || "Unknown error"),
    );
  } catch (error) {
    alert("Error saat mengirim tag all: " + error.message);
  }
});

window.addEventListener("DOMContentLoaded", loadChats);

document
  .getElementById("ownProfilePicToggle")
  .addEventListener("change", function () {
    const selectSection = document.getElementById("selectProfilePicSection");
    const jidInput = document.getElementById("profilePicJid");

    if (this.checked) {
      selectSection.style.display = "none";
      jidInput.value = "@s.whatsapp.net";
      jidInput.readOnly = true;
    } else {
      selectSection.style.display = "block";
      jidInput.value = "";
      jidInput.readOnly = true;
    }
  });

document
  .getElementById("manualProfilePicToggle")
  .addEventListener("change", function () {
    const selectSection = document.getElementById("selectChatSection");
    const manualSection = document.getElementById("manualProfilePicSection");
    const jidInput = document.getElementById("profilePicJid");

    if (this.checked) {
      selectSection.style.display = "none";
      manualSection.style.display = "block";
      jidInput.readOnly = false;
    } else {
      selectSection.style.display = "block";
      manualSection.style.display = "none";
      jidInput.readOnly = true;
    }
  });

document
  .getElementById("manualProfilePicJid")
  .addEventListener("input", function () {
    document.getElementById("profilePicJid").value = this.value;
  });

// Image Preview
document
  .getElementById("profilePicFile")
  .addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const preview = document.getElementById("imagePreview");
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    }
  });

document
  .getElementById("profilePicForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const jid = document.getElementById("profilePicJid").value;
    const fileInput = document.getElementById("profilePicFile");

    if (!fileInput.files[0]) {
      alert("Pilih gambar terlebih dahulu");
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function (e) {
      try {
        const base64Image = e.target.result.split(",")[1];
        const response = await fetch("/update-profile-picture", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jid: jid,
            imageBuffer: base64Image,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          alert("Profile picture berhasil diupdate!");
          fileInput.value = "";
          document.getElementById("imagePreview").innerHTML =
            "<p>Preview gambar akan muncul di sini</p>";
        } else {
          alert("Gagal mengupdate profile picture: " + result.error);
        }
      } catch (error) {
        alert("Terjadi kesalahan: " + error.message);
      }
    };

    reader.readAsDataURL(file);
  });

async function loadProfilePicChatList() {
  try {
    const response = await fetch("/chats");
    const data = await response.json();

    const chatList = document.getElementById("profilePicList");
    chatList.innerHTML = "";

    if (data.groups && data.groups.length > 0) {
      data.groups.forEach((group) => {
        const div = document.createElement("div");
        div.className = "chat-item";
        div.textContent = group.subject || group.id;
        div.onclick = () => {
          document.getElementById("profilePicJid").value = group.id;
        };
        chatList.appendChild(div);
      });
    } else {
      chatList.innerHTML =
        '<div class="empty-list-message">Tidak ada chat yang tersedia</div>';
    }
  } catch (error) {
    console.error("Error loading chat list:", error);
  }
}

document
  .getElementById("profilePicSearch")
  .addEventListener("input", function (e) {
    const searchTerm = e.target.value.toLowerCase();
    const chatItems = document.querySelectorAll("#profilePicList .chat-item");

    chatItems.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(searchTerm) ? "block" : "none";
    });
  });

document
  .querySelector('[data-tab="profilePicTab"]')
  .addEventListener("click", loadProfilePicChatList);
