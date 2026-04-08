'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Camera, Lock, Save, X, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { changePassword, updateUserAvatar, updateCurrentUser } from '@/services/user-service';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  
  // Avatar form
  const [avatarUrl, setAvatarUrl] = useState('');
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (open) {
      try {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        setCurrentUser(user);
        setProfileForm({
          name: user.name || '',
          phone: user.phone || '',
          email: user.email || '',
        });
        setAvatarUrl(user.avatar_url || '');
      } catch {
        // ignore
      }
    }
  }, [open]);

  const handleUpdateProfile = async () => {
    if (!currentUser?.id) return;
    
    try {
      setUpdatingProfile(true);
      await updateCurrentUser(currentUser.id, profileForm);
      
      // Update localStorage
      const updatedUser = { ...currentUser, ...profileForm };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      toast.success('个人信息已更新');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || '更新失败');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdateAvatar = async () => {
    if (!currentUser?.id) {
      toast.error('用户信息不存在');
      return;
    }
    
    if (!avatarUrl) {
      toast.error('请先选择头像');
      return;
    }
    
    try {
      setUpdatingAvatar(true);
      console.log('开始更新头像，数据长度:', avatarUrl.length);
      
      const result = await updateUserAvatar(currentUser.id, avatarUrl);
      console.log('头像更新成功:', result);
      
      // Update localStorage - currentUser
      const updatedUser = { ...currentUser, avatar_url: avatarUrl };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      console.log('currentUser已更新到localStorage');
      
      toast.success('头像已更新，页面将刷新');
      
      // Delay reload to show success message
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('头像更新失败:', error);
      toast.error(error.message || '头像更新失败，请重试');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过2MB');
      return;
    }

    // Convert to Base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setAvatarUrl(base64String);
      setImagePreview(base64String);
    };
    reader.onerror = () => {
      toast.error('图片读取失败');
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleChangePassword = async () => {
    if (!currentUser?.id) return;
    
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('请填写所有密码字段');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('新密码长度不能少于6位');
      return;
    }
    
    try {
      setChangingPassword(true);
      await changePassword(currentUser.id, passwordForm.oldPassword, passwordForm.newPassword);
      
      toast.success('密码修改成功');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || '密码修改失败');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>个人中心</DialogTitle>
          <DialogDescription>管理您的个人信息和密码</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">个人信息</TabsTrigger>
            <TabsTrigger value="avatar">头像设置</TabsTrigger>
            <TabsTrigger value="password">修改密码</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="请输入姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="请输入手机号"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="请输入邮箱"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateProfile} disabled={updatingProfile}>
                <Save className="mr-2 h-4 w-4" />
                {updatingProfile ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="avatar" className="space-y-4 pt-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="w-24 h-24 cursor-pointer" onClick={triggerFileInput}>
                  <AvatarImage src={imagePreview || avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl">
                    <User className="w-12 h-12" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={triggerFileInput}>
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="w-full space-y-2">
                <Label>选择头像</Label>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={triggerFileInput} className="flex-1">
                    <Upload className="mr-2 h-4 w-4" />
                    选择图片
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  支持 JPG、PNG、GIF 格式，大小不超过 2MB
                </p>
              </div>

              <div className="w-full space-y-2">
                <Label htmlFor="avatar-url">或输入图片URL</Label>
                <Input
                  id="avatar-url"
                  value={avatarUrl}
                  onChange={(e) => {
                    setAvatarUrl(e.target.value);
                    setImagePreview('');
                  }}
                  placeholder="请输入头像图片链接"
                />
              </div>

              <DialogFooter>
                <Button onClick={handleUpdateAvatar} disabled={updatingAvatar || !avatarUrl}>
                  <Camera className="mr-2 h-4 w-4" />
                  {updatingAvatar ? '更新中...' : '更新头像'}
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>

          <TabsContent value="password" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">旧密码</Label>
              <Input
                id="old-password"
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                placeholder="请输入旧密码"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">新密码</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="请输入新密码（至少6位）"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">确认新密码</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="请再次输入新密码"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleChangePassword} disabled={changingPassword}>
                <Lock className="mr-2 h-4 w-4" />
                {changingPassword ? '修改中...' : '修改密码'}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
