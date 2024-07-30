document.addEventListener('DOMContentLoaded', function () {
    let mod = "create";
    let committees = JSON.parse(localStorage.getItem('committees')) || [];
    let members = JSON.parse(localStorage.getItem('members')) || [];
    let lastMemberId = parseInt(localStorage.getItem('lastMemberId')) || 0;

    function saveDataToLocalStorage() {
        localStorage.setItem('committees', JSON.stringify(committees));
        localStorage.setItem('members', JSON.stringify(members));
        localStorage.setItem('lastMemberId', lastMemberId.toString());
    }

    function addOrUpdateMember(event) {
        event.preventDefault();
        const memberName = document.getElementById('memberName').value;
        const memberEmail = document.getElementById('memberEmail').value;
        const memberPhone = document.getElementById('memberPhone').value;
        const committeeIndex = document.getElementById('committeeSelect').value;
        const memberImageInput = document.getElementById('memberImage');
        let memberImage = '';
        let memberId;

        if (memberImageInput.files && memberImageInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                memberImage = e.target.result;
                processMemberData();
            };
            reader.readAsDataURL(memberImageInput.files[0]);
        } else {
            processMemberData();
        }

        function processMemberData() {
            let memberIndex;
            if (mod === "create") {
                memberId = ++lastMemberId;
                const member = {
                    id: memberId.toString(),
                    name: memberName,
                    email: memberEmail,
                    phone: memberPhone,
                    committee: committees[committeeIndex].name,
                    image: memberImage
                };
                members.push(member);
                committees[committeeIndex].members.push(member);
                memberIndex = members.length - 1;
            } else if (mod === "update") {
                memberIndex = parseInt(document.getElementById('memberIndex').value);
                const member = members[memberIndex];
                memberId = member.id;
                const oldCommittee = member.committee;

                member.name = memberName;
                member.email = memberEmail;
                member.phone = memberPhone;
                member.committee = committees[committeeIndex].name;
                if (memberImage) {
                    member.image = memberImage;
                }

                const oldCommitteeIndex = committees.findIndex(c => c.name === oldCommittee);
                if (oldCommitteeIndex !== -1) {
                    committees[oldCommitteeIndex].members = committees[oldCommitteeIndex].members.filter(m => m.id !== member.id);
                }

                committees[committeeIndex].members.push(member);
                mod = "create";
            }

            saveDataToLocalStorage();
            clearAddMemberForm();
            displayCommitteeMembers();
            highlightAndScrollToMember(memberId);
        }
    }

    document.getElementById('addMemberForm').addEventListener('submit', addOrUpdateMember);

    function displayCommittees() {
        const committeeSelect = document.getElementById('committeeSelect');
        const committeeSelectList = document.getElementById('committeeSelectlist');
        committeeSelect.innerHTML = '';
        committeeSelectList.innerHTML = '<option value="choic">***************اختر اللجنة***************</option>';

        committees.forEach((committee, index) => {
            const option = document.createElement('option');
            option.text = committee.name;
            option.value = index;
            committeeSelect.appendChild(option);
            committeeSelectList.appendChild(option.cloneNode(true));
        });
    }

    document.getElementById('generatePDFBtn').addEventListener('click', generatePDF);
    document.getElementById('generateEXCELBtn').addEventListener('click', generateExcel);

    function generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add table data
        doc.autoTable({
            head: [['الرقم', 'اسم اللجنة', 'اسم العضو', 'البريد الاليكتروني', 'الهاتف']],
            body: members.map((member, index) => [index + 1, member.committee, member.name, member.email, member.phone])
        });

        // Save the PDF
        doc.save('members.pdf');
    }

    function generateExcel() {
        const worksheet = XLSX.utils.json_to_sheet(members.map((member, index) => ({
            'الرقم': index + 1,
            'اسم اللجنة': member.committee,
            'اسم العضو': member.name,
            'البريد الاليكتروني': member.email,
            'الهاتف': member.phone
        })));
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');

        // Save the Excel file
        XLSX.writeFile(workbook, 'members.xlsx');
    }

    function showCommitteeButtons() {
        const comitybuttonDiv = document.getElementById('comitybutton');
        comitybuttonDiv.innerHTML = `
            <button id="updateCommitteeBtn" class="btn btn-warning btn-sm">تعديل</button>
            <button id="deleteCommitteeBtn" class="btn btn-danger btn-sm">حذف</button>
        `;

        document.getElementById('updateCommitteeBtn').addEventListener('click', updateCommittee);
        document.getElementById('deleteCommitteeBtn').addEventListener('click', deleteCommittee);
    }

    function updateCommittee() {
        const selectedCommitteeIndex = document.getElementById('committeeSelectlist').value;
        const committee = committees[selectedCommitteeIndex];
        document.getElementById('updateCommitteeName').value = committee.name;
        document.getElementById('updateCommitteeIndex').value = selectedCommitteeIndex;
        $('#updateCommitteeModal').modal('show');
    }

    function deleteCommittee() {
        const selectedCommitteeIndex = document.getElementById('committeeSelectlist').value;
    
        // Check if the selected value is valid
        if (selectedCommitteeIndex === "choic") return;
    
        // Get the committee to be deleted
        const committee = committees[selectedCommitteeIndex];
    
        // Confirm deletion
        if (!confirm(`هل تريد فعلا التأكيد على حذف هذه اللجنة "${committee.name}" وجميع الأعضاء المرتبطين بها؟`)) return;

        // Remove members associated with this committee
        members = members.filter(member => member.committee !== committee.name);

        // Remove the committee
        committees.splice(selectedCommitteeIndex, 1);
    
        // Save updated data to local storage
        saveDataToLocalStorage();
    
        // Refresh the displayed committees and members
        displayCommittees();
        displayCommitteeMembers();
    
        // Clear committee buttons if no committee is selected
        document.getElementById('comitybutton').innerHTML = '';
    }

    function displayCommitteeMembers() {
        const outputDiv = document.getElementById('output');
        outputDiv.innerHTML = '';

        members.forEach((member, index) => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-member-id', member.id);
            tr.innerHTML = `<td>${index + 1}</td><td>${member.committee}</td><td>${member.name}</td><td>${member.email}</td><td>${member.phone}</td><td>
                                <button class="btn btn-secondary btn-sm show-btn" data-id="${member.id}"><i class="bi bi-eye icon-sm" title="انقر لاستعراض البطاقة"></i></button>
                                <button class="btn btn-warning btn-sm edit-btn" data-id="${member.id}"><i class="bi bi-pencil-square icon-sm" title="انقر للتعديل على العضو"></i></button>
                                <button class="btn btn-danger btn-sm delete-btn" data-id="${member.id}"><i class="bi bi-trash" title="انقر لحذف العضو"></i></button>
                            </td>`;
            outputDiv.appendChild(tr);
        });

        addEditButtonListeners();
        addDeleteButtonListeners();
        addShowButtonListeners();
    }

    function addEditButtonListeners() {
        const editButtons = document.querySelectorAll('.edit-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', function () {
                const memberId = parseInt(this.getAttribute('data-id'));
                editMember(memberId);
            });
        });
    }

    function addDeleteButtonListeners() {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function () {
                const memberId = parseInt(this.getAttribute('data-id'));
                deleteMember(memberId);
            });
        });
    }

    function addShowButtonListeners() {
        const showButtons = document.querySelectorAll('.show-btn');
        showButtons.forEach(button => {
            button.addEventListener('click', function () {
                const memberId = parseInt(this.getAttribute('data-id'));
                showMemberInfo(memberId);
            });
        });
    }

    function editMember(memberId) {
        const member = members.find(m => m.id == memberId);
        if (!member) return;
        const index = members.findIndex(m => m.id == memberId);
        document.getElementById('memberName').value = member.name;
        document.getElementById('memberEmail').value = member.email;
        document.getElementById('memberPhone').value = member.phone;
        document.getElementById('committeeSelect').value = committees.findIndex(committee => committee.name === member.committee);
        document.getElementById('memberIndex').value = index;

        mod = "update";

        const submitButton = document.querySelector('#addMemberForm button[type="submit"]');
        submitButton.textContent = "تحديث";
        const memTitle = document.querySelector('#addMemberForm h3');
        memTitle.textContent = "تعديل على العضو";

        document.getElementById('addMemberForm').scrollIntoView({ behavior: 'smooth' });

        document.getElementById('memberName').classList.add('bg-warning');
        document.getElementById('memberEmail').classList.add('bg-warning');
        document.getElementById('memberPhone').classList.add('bg-warning');
        document.getElementById('memberImage').classList.add('bg-warning');
        document.getElementById('committeeSelect').classList.add('bg-warning');
    }

    function deleteMember(memberId) {
        const memberIndex = members.findIndex(m => m.id == memberId);
        if (memberIndex === -1) return;
        const member = members[memberIndex];

        if (!confirm(`هل تريد فعلا التأكيد على حذف هذا العضو "${member.name}" ؟`)) return;

        const committee = committees.find(c => c.name === member.committee);
        committee.members = committee.members.filter(m => m.id !== member.id);
        members.splice(memberIndex, 1);
        saveDataToLocalStorage();

        displayCommitteeMembers();
    }

    function showMemberInfo(memberId) {
        const member = members.find(m => m.id === memberId.toString());
        const modalMemberImage = document.getElementById('modalMemberImage');

        if (member) {
            document.getElementById('modalMemberName').textContent = member.name;
            document.getElementById('modalMemberEmail').textContent = member.email;
            document.getElementById('modalMemberPhone').textContent = member.phone;
            document.getElementById('modalMemberCommittee').textContent = member.committee;

            if (member.image) {
                modalMemberImage.src = member.image;
                modalMemberImage.classList.add('zoom');
                modalMemberImage.classList.remove('no-zoom');
            } else {
                modalMemberImage.src = 'images/default-image.png';
                modalMemberImage.classList.add('no-zoom');
                modalMemberImage.classList.remove('zoom');
            }

            const memberInfoModal = new bootstrap.Modal(document.getElementById('memberInfoModal'));
            memberInfoModal.show();
        }
    }

    document.getElementById('modalMemberImage').addEventListener('mouseover', function () {
        if (this.classList.contains('zoom')) {
            this.style.transform = 'scale(3)';
        }
    });

    document.getElementById('modalMemberImage').addEventListener('mouseout', function () {
        this.style.transform = 'none';
    });

    document.getElementById('createCommitteeForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const committeeName = document.getElementById('committeeName').value;
        const committee = { name: committeeName, members: [] };
        committees.push(committee);
        saveDataToLocalStorage();
        document.getElementById('createCommitteeForm').reset();
        displayCommittees();
        highlightAndScrollToCommitteeSelectList();
    });

    function clearAddMemberForm() {
        document.getElementById('addMemberForm').reset();
        document.getElementById('memberIndex').value = '';
        mod = "create";
        const submitButton = document.querySelector('#addMemberForm button[type="submit"]');
        submitButton.textContent = "حفظ";
        const memTitle = document.querySelector('#addMemberForm h3');
        memTitle.textContent = "اضافة عضو جديد";

        document.getElementById('memberName').classList.remove('bg-warning');
        document.getElementById('memberEmail').classList.remove('bg-warning');
        document.getElementById('memberPhone').classList.remove('bg-warning');
        document.getElementById('memberImage').classList.remove('bg-warning');
        document.getElementById('committeeSelect').classList.remove('bg-warning');
    }

    function highlightAndScrollToMember(memberId) {
        const memberRow = document.querySelector(`tr[data-member-id='${memberId}']`);
        if (memberRow) {
            memberRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const tds = memberRow.querySelectorAll('td');
            tds.forEach(td => {
                td.classList.add('bg-success');
            });
            setTimeout(() => {
                tds.forEach(td => {
                    td.classList.remove('bg-success');
                });
            }, 3000);
        }
    }

    function highlightAndScrollToCommitteeSelectList() {
        const committeeSelectList = document.getElementById('committeeSelectlist');
        committeeSelectList.scrollIntoView({ behavior: 'smooth', block: 'center' });
        committeeSelectList.classList.add('bg-success');
        setTimeout(() => {
            committeeSelectList.classList.remove('bg-success');
        }, 3000);
    }

    function addEditCommitteeButtonListeners() {
        const editButtons = document.querySelectorAll('.edit-committee-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', function () {
                const committeeIndex = parseInt(this.getAttribute('data-index'));
                editCommittee(committeeIndex);
            });
        });
    }

    function addDeleteCommitteeButtonListeners() {
        const deleteButtons = document.querySelectorAll('.delete-committee-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function () {
                const committeeIndex = parseInt(this.getAttribute('data-index'));
                deleteCommittee(committeeIndex);
            });
        });
    }

    function editCommittee(committeeIndex) {
        const committee = committees[committeeIndex];
        document.getElementById('updateCommitteeName').value = committee.name;
        document.getElementById('updateCommitteeIndex').value = committeeIndex;
        $('#updateCommitteeModal').modal('show');
    }

    $('#updateCommitteeForm').on('submit', function (e) {
        e.preventDefault();
        const index = document.getElementById('updateCommitteeIndex').value;
        const name = document.getElementById('updateCommitteeName').value;
        const oldName = committees[index].name;
        committees[index].name = name;
        // Update the committee name in members array
        members.forEach(member => {
        if (member.committee === oldName) { member.committee = name; }
         });
        saveDataToLocalStorage();
        displayCommittees();
        displayCommitteeMembers();
        $('#updateCommitteeModal').modal('hide');
        const comitybuttonDiv = document.getElementById('comitybutton');
        comitybuttonDiv.style.display = "none";
        highlightAndScrollToCommitteeSelectList();
    });

    $('#committeeSelectlist').on('change', function () {
        const comitybuttonDiv = document.getElementById('comitybutton');
        if ($(this).val() === "choic") {
            comitybuttonDiv.style.display = "none";
        } else {
            showCommitteeButtons();
            comitybuttonDiv.style.display = "block";
        }
    });

    $(document).ready(function () {
        $('#committeeTable').DataTable({
            responsive: true,
            language: {
                url: "//cdn.datatables.net/plug-ins/1.11.5/i18n/Arabic.json"
            }
        });
    });

    displayCommittees();
    displayCommitteeMembers();
});

