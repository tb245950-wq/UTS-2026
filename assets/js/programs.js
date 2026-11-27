"use strict";

StudyPrograms.init(() => {
  const { $, mode, params, read, byId, sameId, save, remove, message, showFormError, bindForm, cell, element, action } = StudyPrograms;
  const normalize = name => name.trim().replace(/\s+/g, " ");
  const nameKey = name => normalize(name).toLocaleLowerCase("id");

  if (mode !== "list") {
    const program = mode === "update" ? byId(read("programs"), params.get("id")) : null;
    if (mode === "update" && !program) throw new Error("Program studi tidak ditemukan. Buka halaman Edit dari Daftar Prodi.");
    if (program) $("name").value = program.name;

    bindForm(data => {
      const name = normalize(data.get("name"));
      if (name.length < 5 || name.length > 100) {
        showFormError("Nama program studi harus terdiri dari 5–100 karakter.", $("name"));
        return;
      }
      if (read("programs").some(item => !sameId(item.id, program?.id) && nameKey(item.name) === nameKey(name))) {
        showFormError("Nama program studi sudah terdaftar.", $("name"));
        return;
      }
      save("programs", { id: program?.id, name });
      location.href = `index.html?status=${program ? "updated" : "created"}`;
    });
    return;
  }

  const pageSize = 5;
  let page = 1;

  function deleteProgram(program) {
    try {
      const linked = read("organizers").some(item => sameId(item.study_program_id, program.id))
        || read("lecturers").some(item => sameId(item.homebase_id, program.id))
        || read("courses").some(item => sameId(item.study_program_id, program.id));
      if (linked) {
        message($("notice"), "Prodi masih digunakan oleh data pejabat, dosen, atau mata kuliah.", true);
        return;
      }
      if (!confirm(`Hapus program studi "${program.name}"?`)) return;
      remove("programs", program.id);
      render();
      message($("notice"), "Program studi berhasil dihapus.");
    } catch (error) {
      message($("notice"), error.message, true);
    }
  }

  function render() {
    const search = nameKey($("search").value);
    const programs = read("programs").filter(program => nameKey(program.name).includes(search));
    const lastPage = Math.max(1, Math.ceil(programs.length / pageSize));
    page = Math.min(page, lastPage);
    const start = (page - 1) * pageSize;
    $("rows").replaceChildren();
    programs.slice(start, start + pageSize).forEach((program, index) => {
      const row = $("rows").insertRow();
      const id = encodeURIComponent(program.id);
      const actions = element("div", "", "actions");
      actions.append(
        action("Pengaturan", "primary", `organizers/index.html?program_id=${id}`),
        action("Edit", "edit", `update.html?id=${id}`),
        action("Hapus", "danger", () => deleteProgram(program)),
      );
      cell(row, "No", String(start + index + 1));
      cell(row, "Nama Program Studi", element("strong", program.name));
      cell(row, "Aksi", actions);
    });
    const empty = programs.length === 0;
    $("empty").hidden = !empty;
    $("empty").textContent = search ? "Tidak ada prodi yang cocok." : "Belum ada program studi.";
    $("count").textContent = empty ? "0 data" : `Menampilkan ${start + 1}–${Math.min(start + pageSize, programs.length)} dari ${programs.length} data`;
    const pagination = $("pagination");
    pagination.replaceChildren();
    if (empty) return;

    function pageButton(label, target, disabled = false) {
      const button = action(label, target === page && !disabled ? "primary" : "", () => {
        page = target;
        render();
        pagination.querySelector('[aria-current="page"]').focus();
      });
      button.disabled = disabled;
      return button;
    }
    const previous = pageButton("‹", page - 1, page === 1);
    previous.setAttribute("aria-label", "Halaman sebelumnya");
    pagination.append(previous);
    const firstNumber = Math.min(Math.max(1, page - 1), Math.max(1, lastPage - 2));
    for (let number = firstNumber; number <= Math.min(lastPage, firstNumber + 2); number++) {
      const button = pageButton(String(number), number);
      if (number === page) button.setAttribute("aria-current", "page");
      pagination.append(button);
    }
    const next = pageButton("›", page + 1, page === lastPage);
    next.setAttribute("aria-label", "Halaman berikutnya");
    pagination.append(next);
  }

  $("search").addEventListener("input", () => {
    page = 1;
    try {
      render();
    } catch (error) {
      message($("notice"), error.message, true);
    }
  });
  render();
});
