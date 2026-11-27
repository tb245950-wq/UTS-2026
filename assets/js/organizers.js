"use strict";

StudyPrograms.init(() => {
  const { $, mode, params, read, lecturers, byId, sameId, save, remove, message, showFormError, bindForm, cell, element, action } = StudyPrograms;
  const positions = new Map([["chief", "Ketua"], ["secretary", "Sekretaris"]]);
  const program = byId(read("programs"), params.get("program_id"));
  if (!program) throw new Error("Program studi tidak ditemukan. Pilih Pengaturan dari Daftar Prodi.");

  const programQuery = `program_id=${encodeURIComponent(program.id)}`;
  const listUrl = `index.html?${programQuery}`;
  const getTerms = () => read("organizers").filter(item => sameId(item.study_program_id, program.id));
  $("description").textContent = `Program Studi: ${program.name}`;

  if (mode === "list") {
    $("add").href = `create.html?${programQuery}`;
    $("program-name").textContent = program.name;
    renderList();
    return;
  }

  $("cancel").href = listUrl;
  $("settings-crumb").href = listUrl;
  const term = mode === "update" ? byId(getTerms(), params.get("id")) : null;
  if (mode === "update" && !term) throw new Error("Pejabat tidak ditemukan pada program studi ini.");

  const select = $("lecturer");
  const available = lecturers();
  for (const lecturer of available) {
    const option = element("option", `${lecturer.nuptk || "—"} — ${lecturer.email || "—"}`);
    option.value = lecturer.id;
    select.append(option);
  }
  if (!available.length) {
    showFormError("Belum ada dosen. Tambahkan data melalui menu Manajemen Dosen.");
    $("record-form").querySelector('button[type="submit"]').disabled = true;
  }
  if (term) {
    select.value = term.lecturer_id;
    $("record-form").elements.position.value = term.position;
    $("start").value = term.start_date;
    $("end").value = term.end_date;
  }

  bindForm(data => {
    const lecturer = byId(lecturers(), data.get("lecturer_id"));
    const position = data.get("position");
    const start = data.get("start_date");
    const end = data.get("end_date");
    if (!byId(read("programs"), program.id)) throw new Error("Program studi sudah tidak tersedia.");
    if (!lecturer) {
      showFormError("Pilih dosen yang masih terdaftar.", select);
      return;
    }
    if (!positions.has(position)) throw new Error("Pilih jabatan Ketua atau Sekretaris.");
    if (!start || !end || $("end").valueAsNumber <= $("start").valueAsNumber) {
      showFormError("Tanggal selesai harus setelah tanggal mulai.", $("end"));
      return;
    }
    const overlap = getTerms().some(item => !sameId(item.id, term?.id) && item.position === position
      && Date.parse(start) <= Date.parse(item.end_date) && Date.parse(end) >= Date.parse(item.start_date));
    if (overlap) throw new Error(`Masa jabatan ${positions.get(position)} bertumpang tindih dengan riwayat yang ada.`);

    save("organizers", {
      id: term?.id,
      study_program_id: program.id,
      lecturer_id: lecturer.id,
      position,
      start_date: start,
      end_date: end,
    });
    location.href = `${listUrl}&status=${term ? "updated" : "created"}`;
  });

  function renderList() {
    const terms = getTerms().sort((a, b) => Date.parse(b.start_date) - Date.parse(a.start_date));
    const date = new Date();
    const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const people = lecturers();
    for (const position of positions.keys()) {
      const active = terms.find(term => term.position === position
        && Date.parse(term.start_date) <= today && today <= Date.parse(term.end_date));
      $(position).textContent = active ? byId(people, active.lecturer_id)?.email || "Dosen tidak ditemukan" : "—";
    }
    $("rows").replaceChildren();
    $("empty").textContent = "Belum ada riwayat pejabat prodi.";
    $("empty").hidden = terms.length !== 0;
    terms.forEach((item, index) => {
      const row = $("rows").insertRow();
      const lecturer = byId(people, item.lecturer_id);
      const person = element("div", lecturer?.nuptk || "—");
      person.append(element("small", lecturer?.email || "Dosen tidak ditemukan"));
      const actions = element("div", "", "actions");
      actions.append(
        action("Edit", "edit", `update.html?${programQuery}&id=${encodeURIComponent(item.id)}`),
        action("Hapus", "danger", () => {
          if (!confirm("Hapus pejabat ini dari riwayat prodi?")) return;
          try {
            remove("organizers", item.id);
            renderList();
            message($("notice"), "Riwayat pejabat berhasil dihapus.");
          } catch (error) {
            message($("notice"), error.message, true);
          }
        }),
      );
      cell(row, "No", String(index + 1));
      cell(row, "Dosen", person);
      const positionText = positions.has(item.position) ? `${positions.get(item.position)} · ${item.position}` : "Jabatan tidak valid";
      cell(row, "Jabatan", element("span", positionText, item.position === "chief" ? "badge chief" : "badge"));
      cell(row, "Mulai", item.start_date);
      cell(row, "Selesai", item.end_date);
      cell(row, "Aksi", actions);
    });
  }
});
