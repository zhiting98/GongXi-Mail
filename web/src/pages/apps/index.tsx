import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Table,
    Button,
    Space,
    Modal,
    Form,
    Input,
    Select,
    message,
    Popconfirm,
    Tag,
    Typography,
    Tabs,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { appApi } from '../../api';
import { getErrorMessage } from '../../utils/error';
import { requestData } from '../../utils/request';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface AppItem {
    id: number;
    name: string;
    description: string | null;
    fromPatterns: string[];
    subjectPattern: string | null;
    codeRegex: string | null;
    status: 'ACTIVE' | 'DISABLED';
    createdAt: string;
    updatedAt: string;
    createdByName: string;
}

interface AppListResult {
    list: AppItem[];
    total: number;
}

interface RegistrationItem {
    id: number;
    appId: number;
    appName: string;
    emailId: number;
    email: string;
    apiKeyId: number;
    apiKeyName: string;
    createdAt: string;
}

interface RegistrationListResult {
    list: RegistrationItem[];
    total: number;
}

const AppsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('apps');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<AppItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [form] = Form.useForm();
    const latestListRequestIdRef = useRef(0);

    // 注册记录状态
    const [regLoading, setRegLoading] = useState(false);
    const [regData, setRegData] = useState<RegistrationItem[]>([]);
    const [regTotal, setRegTotal] = useState(0);
    const [regPage, setRegPage] = useState(1);
    const [regPageSize, setRegPageSize] = useState(20);

    const fetchData = useCallback(async () => {
        const currentRequestId = ++latestListRequestIdRef.current;
        setLoading(true);
        const result = await requestData<AppListResult>(
            () => appApi.getList({ page, pageSize }),
            '获取数据失败'
        );
        if (currentRequestId !== latestListRequestIdRef.current) return;
        if (result) {
            setData(result.list);
            setTotal(result.total);
        }
        setLoading(false);
    }, [page, pageSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchRegistrations = useCallback(async () => {
        setRegLoading(true);
        const result = await requestData<RegistrationListResult>(
            () => appApi.getRegistrations({ page: regPage, pageSize: regPageSize }),
            '获取注册记录失败'
        );
        if (result) {
            setRegData(result.list);
            setRegTotal(result.total);
        }
        setRegLoading(false);
    }, [regPage, regPageSize]);

    useEffect(() => {
        if (activeTab === 'registrations') {
            fetchRegistrations();
        }
    }, [activeTab, fetchRegistrations]);

    const handleCreate = () => {
        setEditingId(null);
        setDetailLoading(false);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = useCallback(async (record: AppItem) => {
        setEditingId(record.id);
        setDetailLoading(true);
        form.resetFields();
        setModalVisible(true);
        try {
            const detail = await requestData<AppItem>(
                () => appApi.getById(record.id),
                '获取应用详情失败'
            );
            if (detail) {
                form.setFieldsValue({
                    name: detail.name,
                    description: detail.description || '',
                    fromPatterns: detail.fromPatterns || [],
                    subjectPattern: detail.subjectPattern || '',
                    codeRegex: detail.codeRegex || '',
                    status: detail.status,
                });
            }
        } finally {
            setDetailLoading(false);
        }
    }, [form]);

    const handleDelete = useCallback(async (id: number) => {
        try {
            const res = await appApi.delete(id);
            if (res.code === 200) {
                message.success('删除成功');
                fetchData();
            } else {
                message.error(res.message);
            }
        } catch (err: unknown) {
            message.error(getErrorMessage(err, '删除失败'));
        }
    }, [fetchData]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                name: values.name,
                description: values.description || undefined,
                fromPatterns: values.fromPatterns?.filter(Boolean) || [],
                subjectPattern: values.subjectPattern || undefined,
                codeRegex: values.codeRegex || undefined,
            };

            if (editingId) {
                const res = await appApi.update(editingId, {
                    ...payload,
                    status: values.status,
                });
                if (res.code === 200) {
                    message.success('更新成功');
                    setModalVisible(false);
                    fetchData();
                } else {
                    message.error(res.message);
                }
            } else {
                const res = await appApi.create(payload);
                if (res.code === 200) {
                    message.success('创建成功');
                    setModalVisible(false);
                    fetchData();
                } else {
                    message.error(res.message);
                }
            }
        } catch (err: unknown) {
            message.error(getErrorMessage(err, '保存失败'));
        }
    };

    const columns: ColumnsType<AppItem> = useMemo(() => [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            render: (name, record) => (
                <Space>
                    <Text strong>{name}</Text>
                    {record.status === 'DISABLED' && <Tag color="red">已禁用</Tag>}
                </Space>
            ),
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            render: (val) => val ? <Text type="secondary">{val}</Text> : <Text type="secondary">-</Text>,
        },
        {
            title: '发件人匹配',
            dataIndex: 'fromPatterns',
            key: 'fromPatterns',
            width: 200,
            render: (patterns: string[]) =>
                patterns?.length > 0 ? (
                    <Space size={[4, 4]} wrap>
                        {patterns.map((p) => (
                            <Tag key={p} color="blue">{p}</Tag>
                        ))}
                    </Space>
                ) : (
                    <Text type="secondary">未配置</Text>
                ),
        },
        {
            title: '主题匹配',
            dataIndex: 'subjectPattern',
            key: 'subjectPattern',
            width: 140,
            render: (val) => val ? <Tag color="purple">{val}</Tag> : <Text type="secondary">未配置</Text>,
        },
        {
            title: '验证码正则',
            dataIndex: 'codeRegex',
            key: 'codeRegex',
            width: 120,
            render: (val) => val ? <Text code>{val}</Text> : <Text type="secondary">未配置</Text>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (status) => (
                <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
                    {status === 'ACTIVE' ? '启用' : '禁用'}
                </Tag>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="确定要删除此应用吗？"
                        description="删除后相关注册记录也会一并删除"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ], [handleDelete, handleEdit]);

    const regColumns: ColumnsType<RegistrationItem> = useMemo(() => [
        { title: '应用', dataIndex: 'appName', key: 'appName', width: 140, render: (v: string) => <Tag color="blue">{v}</Tag> },
        { title: '邮箱', dataIndex: 'email', key: 'email', width: 260, render: (v: string) => <Text code>{v}</Text> },
        { title: 'API Key', dataIndex: 'apiKeyName', key: 'apiKeyName', width: 140 },
        {
            title: '注册时间', dataIndex: 'createdAt', key: 'createdAt', width: 170,
            render: (v: string) => new Date(v).toLocaleString('zh-CN'),
        },
    ], []);

    const tablePagination = useMemo(
        () => ({
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (count: number) => `共 ${count} 条`,
            onChange: (currentPage: number, currentPageSize: number) => {
                setPage(currentPage);
                setPageSize(currentPageSize);
            },
        }),
        [page, pageSize, total]
    );

    const regPagination = useMemo(
        () => ({
            current: regPage,
            pageSize: regPageSize,
            total: regTotal,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (count: number) => `共 ${count} 条`,
            onChange: (currentPage: number, currentPageSize: number) => {
                setRegPage(currentPage);
                setRegPageSize(currentPageSize);
            },
        }),
        [regPage, regPageSize, regTotal]
    );

    return (
        <div>
            <Title level={4} style={{ marginBottom: 16 }}>应用管理</Title>

            <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key)}
                items={[
                    {
                        key: 'apps',
                        label: '应用列表',
                        children: (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                                    <Space>
                                        <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
                                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>添加应用</Button>
                                    </Space>
                                </div>
                                <Table
                                    columns={columns}
                                    dataSource={data}
                                    rowKey="id"
                                    loading={loading}
                                    pagination={tablePagination}
                                    scroll={{ y: 480, x: 1000 }}
                                />
                            </>
                        ),
                    },
                    {
                        key: 'registrations',
                        label: '注册记录',
                        children: (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                                    <Button icon={<ReloadOutlined />} onClick={fetchRegistrations}>刷新</Button>
                                </div>
                                <Table
                                    columns={regColumns}
                                    dataSource={regData}
                                    rowKey="id"
                                    loading={regLoading}
                                    pagination={regPagination}
                                    scroll={{ y: 480, x: 800 }}
                                />
                            </>
                        ),
                    },
                ]}
            />

            <Modal
                title={editingId ? '编辑应用' : '添加应用'}
                open={modalVisible}
                onOk={handleSubmit}
                onCancel={() => setModalVisible(false)}
                destroyOnClose
                width={560}
                confirmLoading={detailLoading}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="应用名称"
                        rules={[{ required: true, message: '请输入应用名称' }]}
                    >
                        <Input placeholder="例如：Neko API、OpenAI" maxLength={100} />
                    </Form.Item>
                    <Form.Item name="description" label="描述">
                        <Input placeholder="可选，备注说明" maxLength={255} />
                    </Form.Item>
                    <Form.Item
                        name="fromPatterns"
                        label="发件人匹配（多个换行输入）"
                        tooltip="用于在邮件列表中定位验证邮件，匹配发件人地址（不区分大小写）"
                    >
                        <Select
                            mode="tags"
                            placeholder="输入发件人邮箱后按回车添加，如 nekoapi@qq.com"
                            tokenSeparators={[',', ' ']}
                            notFoundContent={null}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="subjectPattern"
                        label="主题关键词"
                        tooltip="用于在邮件列表中定位验证邮件，匹配主题（不区分大小写）"
                    >
                        <Input placeholder="例如：verification code" maxLength={255} />
                    </Form.Item>
                    <Form.Item
                        name="codeRegex"
                        label="验证码正则"
                        tooltip="从邮件正文中提取验证码的正则表达式，第一个捕获组优先"
                    >
                        <Input placeholder="例如：\d{6}" maxLength={100} />
                    </Form.Item>
                    {editingId && (
                        <Form.Item name="status" label="状态">
                            <Select>
                                <Select.Option value="ACTIVE">启用</Select.Option>
                                <Select.Option value="DISABLED">禁用</Select.Option>
                            </Select>
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default AppsPage;
