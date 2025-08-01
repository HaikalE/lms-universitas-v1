import React, { useState } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  BellIcon, 
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  CogIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useNotificationSettings } from '../../contexts/NotificationContext';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettings } = useNotificationSettings();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  const notificationTypes = [
    { key: 'assignment_new', label: 'Tugas Baru', description: 'Notifikasi saat tugas baru dibuat' },
    { key: 'assignment_due', label: 'Deadline Tugas', description: 'Pengingat deadline tugas' },
    { key: 'assignment_graded', label: 'Tugas Dinilai', description: 'Notifikasi saat tugas sudah dinilai' },
    { key: 'announcement', label: 'Pengumuman', description: 'Pengumuman baru dari dosen atau admin' },
    { key: 'forum_reply', label: 'Balasan Forum', description: 'Balasan pada diskusi forum Anda' },
    { key: 'course_enrollment', label: 'Pendaftaran Mata Kuliah', description: 'Konfirmasi pendaftaran mata kuliah' },
    { key: 'general', label: 'Umum', description: 'Notifikasi sistem lainnya' },
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 flex items-center">
                    <CogIcon className="h-5 w-5 mr-2 text-primary-600" />
                    Pengaturan Notifikasi
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Browser Notifications */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <BellIcon className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Browser Notifications</p>
                        <p className="text-xs text-gray-500">Tampilkan notifikasi di browser</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.browserNotifications}
                        onChange={(e) =>
                          setLocalSettings(prev => ({
                            ...prev,
                            browserNotifications: e.target.checked
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* Sound Alerts */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      {localSettings.soundAlerts ? (
                        <SpeakerWaveIcon className="h-5 w-5 text-gray-500 mr-3" />
                      ) : (
                        <SpeakerXMarkIcon className="h-5 w-5 text-gray-500 mr-3" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">Sound Alerts</p>
                        <p className="text-xs text-gray-500">Putar suara untuk notifikasi</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.soundAlerts}
                        onChange={(e) =>
                          setLocalSettings(prev => ({
                            ...prev,
                            soundAlerts: e.target.checked
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  {/* Notification Types */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Jenis Notifikasi</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {notificationTypes.map((type) => (
                        <div key={type.key} className="flex items-start space-x-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={localSettings.notificationTypes[type.key] !== false}
                              onChange={(e) =>
                                setLocalSettings(prev => ({
                                  ...prev,
                                  notificationTypes: {
                                    ...prev.notificationTypes,
                                    [type.key]: e.target.checked
                                  }
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-4 h-4 border-2 border-gray-300 rounded peer-focus:ring-2 peer-focus:ring-primary-300 peer-checked:bg-primary-600 peer-checked:border-primary-600 flex items-center justify-center">
                              {localSettings.notificationTypes[type.key] !== false && (
                                <CheckIcon className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </label>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{type.label}</p>
                            <p className="text-xs text-gray-500">{type.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    Simpan Pengaturan
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default NotificationSettingsModal;
