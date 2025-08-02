import { useState, useLayoutEffect } from 'react';
import { contractMgr } from '@/game/data_mgr/contract_mgr';
import { useNavigate } from 'react-router-dom';

export default function RoomList() {
    const navigate = useNavigate()
    const [showList] = useState(true);
    const [show, setShow] = useState(false);
    const [townIds, setTownIds] = useState<number[]>([]);
    const [names, setNames] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // 控制弹窗打开和关闭的状态
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 输入框的状态
    const [roomName, setRoomName] = useState('');

    useLayoutEffect(() => {
        openRoomList();
    }, []);

    const openRoomList = async () => {
        setShow(true);
        try {
            const [fetchRoomIds, fetchedNames] = await contractMgr.getAllRooms();
            setTownIds(fetchRoomIds);
            setNames(fetchedNames);
        } catch (err) {
            console.error('get room error:', err);
        }
    };

    const confirmSelection = () => {
        if (selectedIndex !== null) {
            const id = townIds[selectedIndex];
            const name = names[selectedIndex];
            console.log(`choose the room: ${id}, ${name}`);

            enterRoom(id);
        } else {
            alert('please enter a room first');
        }
    };

    const enterRoom = async(roomId: number) => {
        const enterRoom = await contractMgr.enterRoom(roomId, "Alice");
        if (enterRoom) {
            console.log("房间进入成功！");
            navigate('/')
        } else {
            console.log("进入房间失败！");
        }
    };

    // 创建房间并打开弹窗
    const createRoom = () => {
        // 这里可以实现请求合约创建房间的逻辑
        console.log('创建房间');

        // 打开弹窗
        setIsModalOpen(true);
    };

    // 关闭弹窗
    const closeModal = () => {
        setIsModalOpen(false);
    };

    // 提交房间名称
    const handleSubmit = async () => {
        if (roomName.trim() === '') {
            alert('房间名称不能为空');
            return;
        }
        console.log(`提交的房间名称: ${roomName}`);
        await contractMgr.createRoom(roomName);
        openRoomList()
        // 关闭弹窗
        closeModal();
    };

    return (
        <div>
            {/* 房间列表部分 */}
            {showList && (
                <div className="p-0">
                    {show && (
                        <div className="fixed inset-0 bg-gray-300/25 backdrop-blur-sm flex justify-center items-start pt-20 z-50">
                            <div className="relative bg-white rounded-lg shadow-lg p-6 w-[32rem] h-[60vh] flex flex-col">
                                <button
                                    onClick={createRoom}
                                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold"
                                    aria-label="创建"
                                >
                                    +
                                </button>
                                <h2 className="text-xl font-semibold mb-4 text-center">房间列表</h2>

                                <div className="flex-1 overflow-y-auto mb-4">
                                    {names.length > 0 ? (
                                        <ul className="grid gap-2">
                                            {names.map((name, idx) => (
                                                <li
                                                    key={idx}
                                                    onClick={() => setSelectedIndex(idx)}
                                                    className={`cursor-pointer p-2 rounded border ${selectedIndex === idx
                                                        ? 'bg-indigo-100 border-indigo-500 text-indigo-800'
                                                        : 'hover:bg-gray-100 border-gray-300'
                                                        }`}
                                                >
                                                    {name}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-gray-500">暂无数据</div>
                                    )}
                                </div>

                                <button
                                    onClick={confirmSelection}
                                    className="w-[120px] h-8 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-base font-medium self-center"
                                >
                                    进入
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 弹窗部分 */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-semibold mb-4">创建新房间</h2>

                        {/* 输入框 */}
                        <input
                            type="text"
                            placeholder="输入房间名称"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            className="w-full p-2 mb-4 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                        {/* 提交按钮 */}
                        <button
                            onClick={handleSubmit}
                            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                        >
                            创建房间
                        </button>

                        {/* 关闭按钮 */}
                        <button
                            onClick={closeModal}
                            className="w-full mt-2 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                        >
                            关闭
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}