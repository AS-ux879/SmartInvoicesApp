// =======================
// notification.js (نظام الإشعارات والتأكيد المخصص)
// =======================

/**
 * يعرض رسالة إشعار مخصصة (تحل محل alert).
 * @param {string} message - الرسالة المراد عرضها.
 * @param {'success'|'error'} type - نوع الإشعار (نجاح أو خطأ).
 */
export function showNotification(message, type = 'success') {
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    // إضافة الفئة show لعرض الإشعار
    setTimeout(() => {
        notification.classList.add('show');
    }, 10); // تأخير بسيط لتفعيل الانتقال

    // إخفاء وحذف الإشعار بعد 3 ثوانٍ
    setTimeout(() => {
        notification.classList.remove('show');
        notification.addEventListener('transitionend', () => {
            notification.remove();
        });
    }, 3000);
}

// إنشاء هيكل الـ Modal لمرة واحدة
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('confirmationModal')) {
        const modalHTML = `
            <div id="confirmationModal">
                <div class="modal-content">
                    <p id="confirmMessage"></p>
                    <div class="modal-actions">
                        <button id="confirmYes"></button>
                        <button id="confirmNo"></button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
});

/**
 * يعرض نافذة تأكيد مخصصة (تحل محل confirm).
 * @param {string} message - رسالة التأكيد.
 * @param {string} yesText - نص زر التأكيد.
 * @param {string} noText - نص زر الإلغاء.
 * @returns {Promise<boolean>} - يعود بـ true للتأكيد، false للإلغاء.
 */
export function showConfirmation(message, yesText, noText) {
    return new Promise(resolve => {
        const modal = document.getElementById('confirmationModal');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmYes = document.getElementById('confirmYes');
        const confirmNo = document.getElementById('confirmNo');

        if (!modal || !confirmMessage || !confirmYes || !confirmNo) {
            console.error("Confirmation modal elements not found.");
            // العودة إلى السلوك الافتراضي في حالة الفشل (استخدام نافذة التنبيه لا ينصح به، ولكنه كحل مؤقت)
            resolve(window.confirm(message));
            return;
        }

        confirmMessage.textContent = message;
        confirmYes.textContent = yesText;
        confirmNo.textContent = noText;

        modal.style.display = 'flex';

        const handleYes = () => {
            modal.style.display = 'none';
            confirmYes.removeEventListener('click', handleYes);
            confirmNo.removeEventListener('click', handleNo);
            resolve(true);
        };

        const handleNo = () => {
            modal.style.display = 'none';
            confirmYes.removeEventListener('click', handleYes);
            confirmNo.removeEventListener('click', handleNo);
            resolve(false);
        };

        confirmYes.addEventListener('click', handleYes);
        confirmNo.addEventListener('click', handleNo);
    });
}
